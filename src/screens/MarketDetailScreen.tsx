import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MarketInfo from '../components/MarketInfo';
import OrderBook from '../components/OrderBook';
import RecentTrades from '../components/RecentTrades';
import TabSwitcher from '../components/TabSwitcher';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';
import { useMarketStream } from '../hooks/useMarketStream';

export default function MarketDetailScreen({ route, navigation }: any) {
  const { marketId } = route.params || { marketId: 'USDT-NGN' };
  const { isPlaying, togglePlay, status, replay } = useMarketStream();
  const [activeTab, setActiveTab] = useState('Order Book');
  const [marketData, setMarketData] = useState<any>(null);
  const insets = useSafeAreaInsets();

  const fetchMarketData = async () => {
    const db = await getDb();

    const marketRow = await db.getFirstAsync<{
      initialChange24h: number;
      initialLastPrice: number;
    }>('SELECT initialChange24h, initialLastPrice FROM markets WHERE id = ?', [
      marketId,
    ]);

    const lastTrade = await db.getFirstAsync<{
      price: number;
      size: string;
      side: string;
      timestamp: number;
    }>(
      'SELECT price, size, side, timestamp FROM trades WHERE market_id = ? ORDER BY timestamp DESC LIMIT 1',
      [marketId]
    );

    const bestBidRow = await db.getFirstAsync<{ price: number }>(
      'SELECT MAX(price) as price FROM order_book WHERE market_id = ? AND side = ?',
      [marketId, 'bid']
    );
    const bestAskRow = await db.getFirstAsync<{ price: number }>(
      'SELECT MIN(price) as price FROM order_book WHERE market_id = ? AND side = ?',
      [marketId, 'ask']
    );

    const bestBid = bestBidRow?.price || 0;
    const bestAsk = bestAskRow?.price || 0;
    const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
    const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    setMarketData({
      lastPrice: lastTrade ? lastTrade.price : marketRow?.initialLastPrice || 0,
      change24h: marketRow?.initialChange24h || 0,
      lastSide: lastTrade?.side || 'buy',
      spread,
      spreadPercent,
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchMarketData();
      const interval = setInterval(fetchMarketData, 1000);
      return () => clearInterval(interval);
    }, [marketId, isPlaying])
  );

  const isPositive = (marketData?.change24h || 0) >= 0;

  const changeColor = isPositive ? Theme.colors.buy : Theme.colors.sell;
  const priceColor =
    marketData?.lastSide === 'sell' ? Theme.colors.sell : Theme.colors.buy;

  return (
    <View style={styles.container}>
      <BlurView
        intensity={20}
        tint="dark"
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{marketId.replace('-', ' / ')}</Text>
        <TouchableOpacity
          onPress={status === 'finished' ? replay : togglePlay}
          style={styles.iconButton}
        >
          <Ionicons
            name={
              status === 'finished'
                ? 'refresh-circle'
                : status === 'playing'
                ? 'pause-circle'
                : 'play-circle'
            }
            size={28}
            color={Theme.colors.accent}
          />
        </TouchableOpacity>
      </BlurView>

      <View style={styles.heroSection}>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.heroPrice, { color: priceColor }]}>
            {marketData?.lastPrice?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }) || '---'}
          </Text>
          <Text style={styles.spreadText}>
            Spread: ₦{marketData?.spread?.toFixed(2) || '0.00'} (
            {marketData?.spreadPercent?.toFixed(2) || '0.00'}%)
          </Text>
        </View>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: isPositive
                ? 'rgba(39, 196, 133, 0.2)'
                : 'rgba(255, 59, 48, 0.2)',
            },
          ]}
        >
          <Text style={[styles.changeText, { color: changeColor }]}>
            {isPositive ? '+' : ''}
            {marketData?.change24h?.toFixed(2)}%
          </Text>
        </View>
      </View>

      <TabSwitcher
        tabs={['Order Book', 'Trades', 'Info']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <View style={styles.content}>
        {activeTab === 'Order Book' ? (
          <OrderBook marketId={marketId} />
        ) : activeTab === 'Trades' ? (
          <RecentTrades marketId={marketId} />
        ) : (
          <MarketInfo marketId={marketId} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Theme.typography.bold.fontFamily,
    color: Theme.colors.text,
    letterSpacing: 1,
  },
  iconButton: {
    padding: 8,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceHighlight,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    marginBottom: 4,
  },
  spreadText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.medium.fontFamily,
    marginBottom: 8,
  },
  heroPrice: {
    fontSize: 36,
    fontFamily: Theme.typography.brand.fontFamily,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 14,
    fontFamily: Theme.typography.bold.fontFamily,
  },
  content: {
    flex: 1,
  },
});
