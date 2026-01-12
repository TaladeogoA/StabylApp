import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';

interface TradeRow {
  id: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

const AnimatedTradeRow = ({ item }: { item: TradeRow }) => {
    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            layout={LinearTransition.springify()}
            style={styles.row}
        >
            <Text style={[styles.cell, { color: item.side === 'buy' ? Theme.colors.success : Theme.colors.error }]}>
                {item.price.toFixed(2)}
            </Text>
            <Text style={styles.cell}>{item.size.toFixed(4)}</Text>
            <Text style={styles.cellTime}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour12: false })}
            </Text>
        </Animated.View>
    );
}

export default function RecentTrades({ marketId }: { marketId: string }) {
  const [trades, setTrades] = useState<TradeRow[]>([]);

  const fetchTrades = async () => {
    const db = await getDb();
      const data = await db.getAllAsync<TradeRow>(
          'SELECT id, price, size, side, timestamp FROM trades WHERE market_id = ? ORDER BY timestamp DESC LIMIT 20',
          [marketId]
      );
      setTrades(data);
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 500);
    return () => clearInterval(interval);
  }, [marketId]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow]}>
          <Text style={styles.headerCell}>Price</Text>
          <Text style={styles.headerCell}>Size</Text>
          <Text style={styles.headerCellTime}>Time</Text>
      </View>
      <View>
          {trades.map((item) => (
             <AnimatedTradeRow key={item.id} item={item} />
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: Theme.colors.background },
  headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: Theme.colors.border,
      paddingBottom: 8
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
      alignItems: 'center'
  },
  cell: {
      fontSize: 13,
      fontFamily: Theme.typography.medium.fontFamily,
      width: '30%',
      color: Theme.colors.text,
      fontVariant: ['tabular-nums']
  },
  headerCell: {
      fontSize: 11,
      fontFamily: Theme.typography.bold.fontFamily,
      width: '30%',
      color: Theme.colors.textSecondary,
      textTransform: 'uppercase'
  },
  cellTime: {
      fontSize: 12,
      color: Theme.colors.textSecondary,
      width: '30%',
      textAlign: 'right',
      fontVariant: ['tabular-nums']
  },
  headerCellTime: {
      fontSize: 11,
      fontFamily: Theme.typography.bold.fontFamily,
      width: '30%',
      color: Theme.colors.textSecondary,
      textAlign: 'right',
      textTransform: 'uppercase'
  }
});
