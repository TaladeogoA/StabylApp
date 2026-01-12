import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MarketRowItem from '../components/MarketRowItem';
import ScreenHeader from '../components/ScreenHeader';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';
import { useMarketStream } from '../hooks/useMarketStream';
import { MarketRow } from '../types';

export default function MarketsScreen({ navigation }: any) {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isReady, isPlaying, eventCount, reset } = useMarketStream();
  const insets = useSafeAreaInsets();

  const fetchMarkets = async () => {
      if (!isReady) return;
      const db = await getDb();
      try {
          const rows = await db.getAllAsync<MarketRow>(`
            SELECT m.id, m.ticker, m.is_favorite, m.initialLastPrice, m.initialChange24h,
            (SELECT price FROM trades WHERE market_id = m.id ORDER BY timestamp DESC LIMIT 1) as lastPrice
            FROM markets m
          `);

      const marketStats = await Promise.all(rows.map(async (m) => {
          const lastTrade = await db.getFirstAsync<{ price: number, side: string, timestamp: number }>(
              'SELECT price, side, timestamp FROM trades WHERE market_id = ? ORDER BY timestamp DESC LIMIT 1',
              [m.id]
          );

          // 2. Get Price 24h ago (or closest before that)
          // We calculate 24h change relative to the LATEST trade timestamp, not wall clock time,
          // to assume correct behavior even if stream data is historical.
          let price24h = m.initialLastPrice || 0;
          if (lastTrade) {
             const lookbackTime = lastTrade.timestamp - (24 * 60 * 60 * 1000);
             const trade24h = await db.getFirstAsync<{ price: number }>(
                  'SELECT price FROM trades WHERE market_id = ? AND timestamp <= ? ORDER BY timestamp DESC LIMIT 1',
                  [m.id, lookbackTime]
             );
             if (trade24h) {
                 price24h = trade24h.price;
             }
          }

          // 3. Get Spread
          const bestBidRow = await db.getFirstAsync<{ price: number }>('SELECT MAX(price) as price FROM order_book WHERE market_id = ? AND side = ?', [m.id, 'bid']);
          const bestAskRow = await db.getFirstAsync<{ price: number }>('SELECT MIN(price) as price FROM order_book WHERE market_id = ? AND side = ?', [m.id, 'ask']);

          const bestBid = bestBidRow?.price || 0;
          const bestAsk = bestAskRow?.price || 0;
          const spread = (bestAsk > 0 && bestBid > 0) ? (bestAsk - bestBid) : 0;
          const spreadPercent = (bestBid > 0) ? (spread / bestBid) * 100 : 0;

          // 4. Calculate Change
          const currentPrice = lastTrade ? lastTrade.price : (m.initialLastPrice || 0);
          let change24h = m.initialChange24h || 0;

          if (price24h > 0 && lastTrade) {
              change24h = ((currentPrice - price24h) / price24h) * 100;
          }

          return {
              ...m,
              lastPrice: currentPrice,
              change24h: change24h,
              lastSide: lastTrade?.side || 'buy',
              spread,
              spreadPercent
          };
      }));

      setMarkets(marketStats);
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
      }, [isReady])
  );

  const toggleFavorite = async (marketId: string) => {
      const db = await getDb();
      try {
          await db.runAsync(
              'UPDATE markets SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?',
              [marketId]
          );
          fetchMarkets();
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>


      <ScreenHeader
          title="Markets"
      />

      <View style={styles.listHeader}>
          <Text style={styles.headerLabel}>Market</Text>
          <Text style={styles.headerLabel}>Price / 24h Change</Text>
      </View>
      <FlatList
          data={markets}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
              <MarketRowItem
                  item={item}
                  navigation={navigation}
                  toggleFavorite={toggleFavorite}
              />
          )}
          refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMarkets(); }} tintColor={Theme.colors.accent} />
          }
          contentContainerStyle={{paddingBottom: 100, paddingTop: 100}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: Theme.colors.background
},
listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingTop: 0,
    marginBottom: 8
},
headerLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontFamily: Theme.typography.medium.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1
}
});
