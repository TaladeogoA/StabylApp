import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';
import { useMarketStream } from '../hooks/useMarketStream';

interface OrderBookRow {
  price: number;
  size: number;
}

export default function OrderBook({ marketId }: { marketId: string }) {
  const [bids, setBids] = useState<OrderBookRow[]>([]);
  const [asks, setAsks] = useState<OrderBookRow[]>([]);
  // We need maxSize to normalize the bars
  const [maxSize, setMaxSize] = useState(1);
  const { isPlaying } = useMarketStream();

  const fetchOrderBook = async () => {
      const db = await getDb();

      const asksData = await db.getAllAsync<OrderBookRow>(
          'SELECT price, size FROM order_book WHERE market_id = ? AND side = ? ORDER BY price ASC LIMIT 15',
          [marketId, 'ask']
      );

      const bidsData = await db.getAllAsync<OrderBookRow>(
          'SELECT price, size FROM order_book WHERE market_id = ? AND side = ? ORDER BY price DESC LIMIT 15',
          [marketId, 'bid']
      );

      // Find global max size in this view to scale bars
      let max = 0;
      [...asksData, ...bidsData].forEach(r => max = Math.max(max, r.size));
      if (max === 0) max = 1;

      setMaxSize(max);
      setAsks(asksData); // Asks: Low to High (standard list)
      setBids(bidsData); // Bids: High to Low
  };

  useEffect(() => {
      fetchOrderBook();
      const interval = setInterval(fetchOrderBook, 500);
      return () => clearInterval(interval);
  }, [marketId]);

  const renderSide = (data: OrderBookRow[], type: 'bid' | 'ask') => {
      return (
          <View style={styles.column}>
              <View style={styles.headerRow}>
                  <Text style={styles.headerText}>{type === 'bid' ? 'Bid' : 'Ask'}</Text>
                  <Text style={styles.headerText}>Size</Text>
              </View>
              {data.map((item, i) => {
                  const barWidth = (item.size / maxSize) * 100;
                  const color = type === 'bid' ? Theme.colors.success : Theme.colors.error;
                  const bg = type === 'bid' ? Theme.colors.depthBuy : Theme.colors.depthSell;

                  return (
                      <View key={i} style={styles.row}>
                          {/* Depth Bar Background */}
                          <View
                             style={[
                                 styles.bar,
                                 {
                                     backgroundColor: bg,
                                     width: `${barWidth}%`,
                                     right: type === 'bid' ? 0 : undefined,
                                     left: type === 'ask' ? 0 : undefined
                                 }
                             ]}
                          />

                          {/* Price */}
                          <Text style={[styles.cell, { color, textAlign: type === 'bid' ? 'right' : 'left' }]}>
                              {item.price.toFixed(2)}
                          </Text>

                          {/* Size */}
                          <Text style={[styles.cell, { color: Theme.colors.textSecondary, textAlign: 'right' }]}>
                              {item.size.toFixed(4)}
                          </Text>
                      </View>
                  );
              })}
          </View>
      );
  };

  return (
    <View style={styles.container}>
      {/* 2 Column Layout */}
      <View style={styles.wrapper}>
          {/* Left: Bids */}
          {renderSide(bids, 'bid')}

          {/* Divider */}
          <View style={{width: 1, backgroundColor: Theme.colors.border}} />

          {/* Right: Asks */}
          {renderSide(asks, 'ask')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  wrapper: { flexDirection: 'row', flex: 1 },
  column: { flex: 1 },
  headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: Theme.colors.border
  },
  headerText: { color: Theme.colors.textSecondary, fontSize: 12 },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      paddingHorizontal: 8,
      position: 'relative',
      height: 24,
      alignItems: 'center'
  },
  cell: { fontSize: 11, fontWeight: '600', zIndex: 2 },
  bar: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      zIndex: 1
  }
});
