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
      const rows = await db.getAllAsync<{ lastPrice: number, change24h: number }>(`
        SELECT
        (SELECT price FROM trades WHERE market_id = ? ORDER BY timestamp DESC LIMIT 1) as lastPrice,
        -1.25 as change24h
      `, [marketId]);

      if (rows && rows.length > 0) {
          const data = rows[0];
          setMarketData({
              ...data,
              lastPrice: data.lastPrice || 0,
              change24h: isPlaying ? (Math.floor(Math.random() * 1000) / 100 - 5) : -1.25
          });
      }
  };

  useFocusEffect(
      useCallback(() => {
          fetchMarketData();
          const interval = setInterval(fetchMarketData, 1000);
          return () => clearInterval(interval);
      }, [marketId, isPlaying])
  );

  const isPositive = (marketData?.change24h || 0) >= 0;
  const statusColor = isPositive ? Theme.colors.buy : Theme.colors.sell;

  return (
    <View style={styles.container}>

       <BlurView intensity={20} tint="dark" style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={Theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{marketId.replace('-', ' / ')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={replay} style={styles.iconButton}>
                  <Ionicons name="refresh-circle" size={28} color={Theme.colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlay} style={styles.iconButton}>
                  <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={28} color={Theme.colors.accent} />
              </TouchableOpacity>
          </View>
       </BlurView>

       <View style={styles.heroSection}>
           <View>
               <Text style={[styles.heroPrice, { color: statusColor }]}>
                   {marketData?.lastPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '---'}
               </Text>
           </View>
           <View style={[styles.pill, { backgroundColor: isPositive ? 'rgba(39, 196, 133, 0.2)' : 'rgba(255, 59, 48, 0.2)' }]}>
               <Text style={[styles.changeText, { color: statusColor }]}>
                   {isPositive ? '+' : ''}{marketData?.change24h?.toFixed(2)}%
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
    backgroundColor: Theme.colors.background
},
header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)'
},
backButton: {
    padding: 8
},
headerTitle: {
    fontSize: 16,
    fontFamily: Theme.typography.bold.fontFamily,
    color: Theme.colors.text,
    letterSpacing: 1
},
iconButton: {
    padding: 8
},
heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceHighlight
},
heroPrice: {
    fontSize: 36,
    fontFamily: Theme.typography.brand.fontFamily,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    marginBottom: 8
},
pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
},
changeText: {
    fontSize: 14,
    fontFamily: Theme.typography.bold.fontFamily
},
content: {
    flex: 1
}
});
