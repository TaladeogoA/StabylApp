import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getDb } from '../db/schema';
import { useMarketStream } from '../hooks/useMarketStream';

interface MarketRow {
    id: string;
    ticker: string;
    lastPrice: number;
    change24h: number;
}

export default function MarketsScreen({ navigation }: any) {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPlaying } = useMarketStream();

  const fetchMarkets = async () => {
      try {
          const db = await getDb();
          // We get the list of markets, and for each we want the latest trade price.
          // A robust way is a subquery or just looping. Given small N (2 markets), looping is fine and easy to debug.

          const marketsDef = await db.getAllAsync<{ id: string, ticker: string, initialLastPrice: number, initialChange24h: number }>('SELECT * FROM markets');

          const rows: MarketRow[] = [];
          for (const m of marketsDef) {
              // Get latest trade
              // We rely on 'timestamp' DESC.
              const trade = await db.getFirstAsync<{ price: number }>(
                  'SELECT price FROM trades WHERE market_id = ? ORDER BY timestamp DESC LIMIT 1',
                  [m.id]
              );

              rows.push({
                  id: m.id,
                  ticker: m.ticker,
                  lastPrice: trade ? trade.price : m.initialLastPrice,
                  change24h: m.initialChange24h // Keeping static for now as per plan
              });
          }

          setMarkets(rows);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useFocusEffect(
      useCallback(() => {
          fetchMarkets();

          // Poll if streaming to show live updates
          const interval = setInterval(() => {
             // Only query if we are likely to have updates?
             // Or just always poll for simplicity.
             fetchMarkets();
          }, 1000);

          return () => clearInterval(interval);
      }, [])
  );

  const renderItem = ({ item }: { item: MarketRow }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('MarketDetail', { marketId: item.id })}
      >
          <View>
              <Text style={styles.ticker}>{item.ticker}</Text>
              <Text style={styles.subText}>Vol: --</Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.price}>{item.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              <Text style={[styles.change, { color: item.change24h >= 0 ? 'green' : 'red' }]}>
                  {item.change24h > 0 ? '+' : ''}{item.change24h}%
              </Text>
          </View>
      </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Markets</Text>
      <FlatList
          data={markets}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMarkets} />}
          contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: { fontSize: 32, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 10 },
  card: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: '#f9f9f9',
      marginBottom: 10,
      borderRadius: 12,
  },
  ticker: { fontSize: 18, fontWeight: '600' },
  subText: { fontSize: 12, color: '#888', marginTop: 4 },
  price: { fontSize: 18, fontWeight: 'bold' },
  change: { fontSize: 14, fontWeight: '500', marginTop: 4 }
});
