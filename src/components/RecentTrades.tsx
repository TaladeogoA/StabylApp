import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { getDb } from '../db/schema';

interface TradeRow {
  id: string;
  price: number;
  size: number;
  side: string;
  timestamp: number;
}

export default function RecentTrades({ marketId }: { marketId: string }) {
  const [trades, setTrades] = useState<TradeRow[]>([]);

  const fetchTrades = async () => {
      const db = await getDb();
      const res = await db.getAllAsync<TradeRow>(
          'SELECT * FROM trades WHERE market_id = ? ORDER BY timestamp DESC LIMIT 20',
          [marketId]
      );
      setTrades(res);
  };

  useEffect(() => {
      fetchTrades();
      const interval = setInterval(fetchTrades, 1000);
      return () => clearInterval(interval);
  }, [marketId]);

  const renderItem = ({ item }: { item: TradeRow }) => (
      <View style={styles.row}>
          <Text style={[styles.cell, { color: item.side === 'buy' ? 'green' : 'red' }]}>
              {item.price.toFixed(2)}
          </Text>
          <Text style={styles.cell}>{item.size.toFixed(4)}</Text>
          <Text style={styles.cellTime}>
             {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
      </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recent Trades</Text>
      <FlatList
          data={trades}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          scrollEnabled={false} // usually trades is a fixed list in mobile view or inside scrollview
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20, padding: 10 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cell: { fontSize: 12, fontFamily: 'Courier', width: 80 },
  cellTime: { fontSize: 12, color: '#888', textAlign: 'right', flex: 1}
});
