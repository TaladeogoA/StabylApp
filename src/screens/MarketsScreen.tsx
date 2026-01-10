import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Theme';
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
  const [refreshing, setRefreshing] = useState(false);
  const { isReady, isPlaying } = useMarketStream();

  const fetchMarkets = async () => {
      if (!isReady) return;
      const db = await getDb();
      try {
          const rows = await db.getAllAsync<MarketRow>(`
            SELECT m.id, m.ticker,
            (SELECT price FROM trades WHERE market_id = m.id ORDER BY timestamp DESC LIMIT 1) as lastPrice
            FROM markets m
          `);

          const data = rows.map(r => ({
              ...r,
              lastPrice: r.lastPrice || 0,
              change24h: isPlaying ? (Math.floor(Math.random() * 1000) / 100 - 5) : 0
          }));
          setMarkets(data);
      } catch (e) {
          console.error(e);
      }
      setRefreshing(false);
  };

  useFocusEffect(
      useCallback(() => {
          fetchMarkets();
          const interval = setInterval(fetchMarkets, 1000);
          return () => clearInterval(interval);
      }, [isReady, isPlaying])
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
              <Text style={[styles.change, { color: item.change24h >= 0 ? Theme.colors.success : Theme.colors.error }]}>
                  {item.change24h > 0 ? '+' : ''}{item.change24h.toFixed(2)}%
              </Text>
          </View>
      </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
          data={markets}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMarkets(); }} tintColor={Theme.colors.text} />
          }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  card: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Theme.colors.surfaceHighlight,
      backgroundColor: Theme.colors.surface
  },
  ticker: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  subText: { color: Theme.colors.textSecondary, fontSize: 12 },
  price: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  change: { fontSize: 14 }
});
