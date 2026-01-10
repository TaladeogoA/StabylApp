import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getDb } from '../db/schema';
import { useMarketStream } from '../hooks/useMarketStream';

interface OrderBookRow {
  price: number;
  size: number;
  total?: number;
}

export default function OrderBook({ marketId }: { marketId: string }) {
  const [bids, setBids] = useState<OrderBookRow[]>([]);
  const [asks, setAsks] = useState<OrderBookRow[]>([]);
  const { isPlaying } = useMarketStream();

  const fetchOrderBook = async () => {
      const db = await getDb();

      // Top 15 Asks (Lowest first)
      const asksData = await db.getAllAsync<OrderBookRow>(
          'SELECT price, size FROM order_book WHERE market_id = ? AND side = ? ORDER BY price ASC LIMIT 15',
          [marketId, 'ask']
      );

      // Top 15 Bids (Highest first)
      const bidsData = await db.getAllAsync<OrderBookRow>(
          'SELECT price, size FROM order_book WHERE market_id = ? AND side = ? ORDER BY price DESC LIMIT 15',
          [marketId, 'bid']
      );

      setAsks(asksData.reverse()); // Show highest ask at top of its list (closest to spread)? Or standard list.
      // Standard OB: Asks stack up from spread. Bids stack down from spread.
      // Let's keep Asks as ASC (lowest price - best ask - at bottom of ask list? or top?).
      // Convention:
      // Asks: High Price
      //       ...
      //       Low Price (Best Ask)
      // ----------------------
      //       High Price (Best Bid)
      //       ...
      // Bids: Low Price

      // So fetch gives us Lowest Asks. If we render top-down, we want Highest Asks first. So reverse ASC result.
      setAsks(asksData.reverse());
      setBids(bidsData);
  };

  useEffect(() => {
      fetchOrderBook();
      const interval = setInterval(fetchOrderBook, 500); // 2Hz refresh for smoothness
      return () => clearInterval(interval);
  }, [marketId]);

  const renderRow = (item: OrderBookRow, type: 'bid' | 'ask') => (
      <View style={styles.row}>
          <Text style={[styles.cell, { color: type === 'bid' ? 'green' : 'red' }]}>
              {item.price.toFixed(2)}
          </Text>
          <Text style={styles.cell}>{item.size.toFixed(4)}</Text>
      </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order Book</Text>

      {/* Asks */}
      <View style={styles.section}>
          {asks.map((item, i) => <View key={`ask-${i}`}>{renderRow(item, 'ask')}</View>)}
      </View>

      <View style={styles.spread}>
         <Text style={styles.spreadText}>--- Spread ---</Text>
      </View>

      {/* Bids */}
      <View style={styles.section}>
          {bids.map((item, i) => <View key={`bid-${i}`}>{renderRow(item, 'bid')}</View>)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  section: {
    minHeight: 100
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  cell: {
    fontSize: 12,
    fontFamily: 'Courier'
  },
  spread: {
    alignItems: 'center',
    marginVertical: 5
  },
  spreadText: {
    color: '#888',
    fontSize: 10
  }
});
