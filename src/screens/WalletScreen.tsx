import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import WalletRowItem from '../components/WalletRowItem';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';
import { WalletRow } from '../types';

import { calculatePortfolioValue, getCurrentTimestamp, getPriceAtTime } from '../utils/pnl';

const STORAGE_KEY_HIDE_SMALL = 'settings_hide_small_balances';

export default function WalletScreen() {
  const [balances, setBalances] = useState<WalletRow[]>([]);
  const [hideSmall, setHideSmall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalUsd, setTotalUsd] = useState(0);
  const [pnlPercent, setPnlPercent] = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
      (async () => {
          const stored = await AsyncStorage.getItem(STORAGE_KEY_HIDE_SMALL);
          if (stored !== null) {
              setHideSmall(JSON.parse(stored));
          }
      })();
  }, []);

  const fetchBalances = async () => {
      try {
          const db = await getDb();

          const balanceRows = await db.getAllAsync<WalletRow>(
              'SELECT b.asset, b.available, b.locked, a.decimals FROM balances b JOIN assets a ON b.asset = a.symbol'
          );

          // 1. Get "Now" from stream time
          const now = await getCurrentTimestamp(db);
          const yesterday = now - (24 * 60 * 60 * 1000);

          const enrichedBalances = await Promise.all(balanceRows.map(async (b) => {
              const totalAmount = b.available + b.locked;
              const price = await getPriceAtTime(db, b.asset, now);

              return {
                  ...b,
                  usdtValue: totalAmount * price
              };
          }));

          const totalNow = enrichedBalances.reduce((acc, curr) => acc + (curr.usdtValue || 0), 0);

          // 2. Calculate 24h ago value efficiently
          // We pass the raw balance rows to calculatePortfolioValue - it handles the logic
          // Note: This assumes balances didn't change (simplified PnL based on *current* holdings performance)
          // which is standard for "Day's PnL" display in most wallets.
          const totalYesterday = await calculatePortfolioValue(db, balanceRows, yesterday);

          let calculatedPnl = 0;
          if (totalYesterday > 0) {
              calculatedPnl = ((totalNow - totalYesterday) / totalYesterday) * 100;
          }

          setTotalUsd(totalNow);
          setPnlPercent(calculatedPnl);
          setBalances(enrichedBalances);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useFocusEffect(
      useCallback(() => {
          fetchBalances();
      }, [])
  );

  const toggleHideSmall = async (value: boolean) => {
      setHideSmall(value);
      await AsyncStorage.setItem(STORAGE_KEY_HIDE_SMALL, JSON.stringify(value));
  };

  const filteredBalances = balances.filter(b => {
      if (!hideSmall) return true;
      const amount = b.available + b.locked;
      if (amount === 0) return false;
      return (b.usdtValue || 0) >= 10;
  });

  return (


    <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.backgroundContainer} />
        <ScreenHeader title="Wallet" />

        <ScrollView
            contentContainerStyle={[styles.scroll]}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBalances} tintColor={Theme.colors.text} />}
        >
            <View style={styles.header}>
                <Text style={styles.headerLabel}>Total Balance</Text>
                <Text style={styles.headerValue}>
                    ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <View style={[styles.pnlTag, { backgroundColor: (pnlPercent || 0) >= 0 ? 'rgba(39, 196, 133, 0.15)' : 'rgba(255, 59, 48, 0.15)' }]}>
                    <Text style={[styles.pnlText, { color: (pnlPercent || 0) >= 0 ? Theme.colors.buy : Theme.colors.sell }]}>
                        {(pnlPercent || 0) > 0 ? '+' : ''}{(pnlPercent || 0).toFixed(2)}% (24h)
                    </Text>
                </View>
            </View>

            <View style={styles.controls}>
                <View style={styles.toggleRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Ionicons name="eye-off-outline" size={16} color={Theme.colors.textSecondary} style={{marginRight: 6}} />
                        <Text style={styles.toggleLabel}>Hide Small Balances</Text>
                    </View>
                    <Switch
                        value={hideSmall}
                        onValueChange={toggleHideSmall}
                        trackColor={{ false: '#3a3a44', true: Theme.colors.primary }}
                        thumbColor="#fff"
                        ios_backgroundColor="#3a3a44"
                    />
                </View>
            </View>

            <View style={styles.listContainer}>
                {filteredBalances.map((item, index) => (
                    <WalletRowItem key={item.asset} item={item} index={index} />
                ))}
            </View>

            <View style={{height: 100}} />
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
container: {
        flex: 1,
        backgroundColor: Theme.colors.background
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050510'
    },
    scroll: { paddingHorizontal: 16
    },

    header: {
      alignItems: 'center',
      marginBottom: 32,
      marginTop: 32
  },
  headerLabel: {
      fontSize: 14,
      color: Theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8
  },
  headerValue: {
      fontSize: 40,
      fontFamily: Theme.typography.brand.fontFamily,
      color: '#fff',
      marginBottom: 8
  },
  pnlTag: {
      backgroundColor: 'rgba(39, 196, 133, 0.15)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 100
  },
  pnlText: {
      color: Theme.colors.buy,
      fontFamily: Theme.typography.bold.fontFamily,
      fontSize: 12
  },

  controls: {
      marginBottom: 16
  },
  toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  toggleLabel: {
      color: Theme.colors.textSecondary,
      fontFamily: Theme.typography.medium.fontFamily
  },

  listContainer: {
      marginTop: 8
  }
});
