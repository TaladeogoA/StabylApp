import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';

interface WalletRow {
    asset: string;
    available: number;
    locked: number;
    decimals: number;
}

const STORAGE_KEY_HIDE_SMALL = 'settings_hide_small_balances';

export default function WalletScreen() {
  const [balances, setBalances] = useState<WalletRow[]>([]);
  const [hideSmall, setHideSmall] = useState(false);
  const [loading, setLoading] = useState(true);

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
          const rows = await db.getAllAsync<WalletRow>(
              'SELECT b.asset, b.available, b.locked, a.decimals FROM balances b JOIN assets a ON b.asset = a.assetId'
          );
          setBalances(rows);
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
      const total = b.available + b.locked;
      return total >= 0.000001;
  });

  const renderItem = ({ item }: { item: WalletRow }) => {
      const total = item.available + item.locked;

      return (
          <View style={styles.card}>
              <View style={styles.row}>
                  <Text style={styles.asset}>{item.asset}</Text>
                  <Text style={styles.total}>{total.toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                  <Text style={styles.label}>Available:</Text>
                  <Text style={styles.value}>{item.available.toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                  <Text style={styles.label}>Locked:</Text>
                  <Text style={styles.value}>{item.locked.toLocaleString()}</Text>
              </View>
          </View>
      );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Hide Small Balances</Text>
              <Switch value={hideSmall} onValueChange={toggleHideSmall} trackColor={{ false: '#767577', true: Theme.colors.primary }} />
          </View>
      </View>

      <FlatList
          data={filteredBalances}
          keyExtractor={item => item.asset}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBalances} tintColor={Theme.colors.text} />}
          contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, paddingTop: 60 },
  header: {
      paddingHorizontal: 16,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  title: { fontSize: 32, fontWeight: 'bold', color: Theme.colors.text },
  toggleContainer: { flexDirection: 'row', alignItems: 'center' },
  toggleLabel: { marginRight: 8, fontSize: 14, color: Theme.colors.textSecondary },

  card: {
      backgroundColor: Theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Theme.colors.surfaceHighlight
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  asset: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  total: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  label: { fontSize: 14, color: Theme.colors.textSecondary },
  value: { fontSize: 14, color: Theme.colors.text }
});
