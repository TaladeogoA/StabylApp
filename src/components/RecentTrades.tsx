import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';

interface TradeRow {
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export default function RecentTrades({ marketId }: { marketId: string }) {
  const [trades, setTrades] = useState<TradeRow[]>([]);

  const fetchTrades = async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<TradeRow>(
        'SELECT price, size, side, timestamp FROM trades WHERE market_id = ? ORDER BY timestamp DESC LIMIT 20',
        [marketId]
    );
    setTrades(rows);
  };

  useEffect(() => {
    // Initial fetch
    fetchTrades();
    // Poll every 500ms
    const interval = setInterval(fetchTrades, 500);
    return () => clearInterval(interval);
  }, [marketId]);

  const renderItem = ({ item }: { item: TradeRow }) => (
      <View style={styles.row}>
          <Text style={[styles.cell, { color: item.side === 'buy' ? Theme.colors.success : Theme.colors.error }]}>
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
      <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: Theme.colors.border, paddingBottom: 5 }]}>
          <Text style={styles.headerCell}>Price</Text>
          <Text style={styles.headerCell}>Size</Text>
          <Text style={styles.headerCell}>Time</Text>
      </View>
      <FlatList
         data={trades}
         keyExtractor={(item, index) => `${item.timestamp}-${index}`}
         renderItem={renderItem}
         scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: Theme.colors.background },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cell: { fontSize: 12, width: '30%', color: Theme.colors.text },
  headerCell: { fontSize: 12, fontWeight: 'bold', width: '30%', color: Theme.colors.textSecondary },
  cellTime: { fontSize: 11, color: Theme.colors.textSecondary, width: '30%', textAlign: 'right' }
});
