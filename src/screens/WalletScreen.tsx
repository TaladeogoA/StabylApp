import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';

interface WalletRow {
    asset: string;
    available: number;
    locked: number;
    decimals: number;
    usdtValue?: number;
}

const STORAGE_KEY_HIDE_SMALL = 'settings_hide_small_balances';

export default function WalletScreen() {
  const [balances, setBalances] = useState<WalletRow[]>([]);
  const [hideSmall, setHideSmall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalUsd, setTotalUsd] = useState(0);
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

          const enrichedBalances = await Promise.all(balanceRows.map(async (b) => {
              const totalAmount = b.available + b.locked;
              let price = 0;

              if (b.asset === 'USDT' || b.asset === 'USDC') {
                  price = 1;
              } else if (b.asset === 'NGN') {
                   const marketId = 'USDT-NGN';
                   const trade = await db.getFirstAsync<{ price: number }>(
                      'SELECT price FROM trades WHERE market_id = ? ORDER BY timestamp DESC LIMIT 1',
                      [marketId]
                   );
                   if (trade && trade.price > 0) {
                       price = 1 / trade.price;
                   }
              } else {
                  const marketId = `${b.asset}-USDT`;
                  const trade = await db.getFirstAsync<{ price: number }>(
                      'SELECT price FROM trades WHERE market_id = ? ORDER BY timestamp DESC LIMIT 1',
                      [marketId]
                  );
                  price = trade?.price || 0;
              }

              return {
                  ...b,
                  usdtValue: totalAmount * price
              };
          }));

          const total = enrichedBalances.reduce((acc, curr) => acc + (curr.usdtValue || 0), 0);

          setTotalUsd(total);
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
      return (b.usdtValue || 0) >= 1;
  });

  const renderItem = ({ item, index }: { item: WalletRow, index: number }) => {
      const total = item.available + item.locked;
      const formattedTotal = total.toLocaleString(undefined, { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals });
      const usdtVal = item.usdtValue?.toLocaleString(undefined, { maximumFractionDigits: 2 });

      return (
          <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            exiting={FadeOutUp}
            layout={Layout.springify()}
            style={{marginBottom: 12}}
          >
              <BlurView intensity={20} tint="dark" style={styles.card}>
                  <View style={styles.cardHeader}>
                      <View style={styles.assetInfo}>
                           <View style={[styles.iconCircle, { backgroundColor: Theme.colors.background }]}>
                               <Text style={styles.iconText}>{item.asset[0]}</Text>
                           </View>
                           <View>
                               <Text style={styles.assetSymbol}>{item.asset}</Text>
                               <Text style={styles.assetName}>Asset</Text>
                           </View>
                      </View>
                      <View style={styles.valueInfo}>
                          <Text style={styles.usdtValue}>{formattedTotal} {item.asset}</Text>
                          <Text style={styles.amountValue}>≈ ${usdtVal}</Text>
                      </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailsRow}>
                      <View>
                          <Text style={styles.label}>Available</Text>
                          <Text style={styles.subValue}>{item.available.toLocaleString(undefined, { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals })}</Text>
                      </View>
                      <View style={{alignItems: 'flex-end'}}>
                          <Text style={styles.label}>Locked</Text>
                          <Text style={styles.subValue}>{item.locked.toLocaleString(undefined, { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals })}</Text>
                      </View>
                  </View>
              </BlurView>
          </Animated.View>
      );
  };

  return (
    <View style={styles.container}>
        <View style={styles.backgroundContainer} />

        <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBalances} tintColor={Theme.colors.text} />}
        >
            <View style={styles.header}>
                <Text style={styles.headerLabel}>Total Balance</Text>
                <Text style={styles.headerValue}>
                    ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <View style={styles.pnlTag}>
                    <Text style={styles.pnlText}>+2.45% (24h)</Text>
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
                    <React.Fragment key={item.asset}>
                        {renderItem({ item, index })}
                    </React.Fragment>
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
      fontWeight: '800',
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
      fontWeight: '700',
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
      fontWeight: '600'
  },

  listContainer: {
      marginTop: 8
  },

  card: {
      borderRadius: 20,
      padding: 20,
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      overflow: 'hidden'
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  assetInfo: {
      flexDirection: 'row',
      alignItems: 'center'
  },
  iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12
  },
  iconText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Theme.colors.text
  },
  assetSymbol: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff'
  },
  assetName: {
      fontSize: 12,
      color: Theme.colors.textSecondary
  },
  valueInfo: {
      alignItems: 'flex-end'
  },
  usdtValue: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff'
  },
  amountValue: {
      fontSize: 12,
      color: Theme.colors.textSecondary,
      marginTop: 2
  },

  divider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.08)',
      marginVertical: 16
  },

  detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between'
  },
  label: {
      fontSize: 11,
      color: Theme.colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 4
  },
  subValue: {
      fontSize: 14,
      fontWeight: '600',
      color: Theme.colors.text
  }
});
