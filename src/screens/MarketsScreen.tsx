import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';
import { useMarketStream } from '../hooks/useMarketStream';

interface MarketRow {
    id: string;
    ticker: string;
    lastPrice: number;
    change24h: number;
    is_favorite: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const MarketRowItem = ({ item, navigation, toggleFavorite }: { item: MarketRow, navigation: any, toggleFavorite: (id: string) => void }) => {
    const scale = useSharedValue(1);
    const starScale = useSharedValue(1);

    const rStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const rStarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: starScale.value }]
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.98, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const handleFavorite = () => {
        starScale.value = withSequence(
            withSpring(1.5),
            withSpring(1)
        );
        toggleFavorite(item.id);
    };

    const isPositive = item.change24h >= 0;
    const changeColor = isPositive ? Theme.colors.buy : Theme.colors.sell;

    return (
        <AnimatedTouchableOpacity
            style={[styles.rowCard, rStyle]}
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate('MarketDetail', { marketId: item.id })}
        >
            <View style={styles.leftCol}>
                <View style={styles.tickerRow}>
                    <Text style={styles.ticker}>{item.ticker.replace('-', ' / ')}</Text>
                </View>
                <View style={styles.volRow}>
                    <TouchableOpacity onPress={handleFavorite} hitSlop={10}>
                        <Animated.Text style={[styles.star, rStarStyle, { color: item.is_favorite ? Theme.colors.accent : Theme.colors.textSecondary }]}>
                            {item.is_favorite ? '★' : '☆'}
                        </Animated.Text>
                    </TouchableOpacity>
                    <Text style={styles.subText}>Vol $24.5M</Text>
                </View>
            </View>

            <View style={styles.rightCol}>
                <Text style={styles.price}>{item.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <View style={[
                    styles.changeBadge,
                    {
                        borderColor: changeColor,
                        backgroundColor: isPositive ? Theme.colors.depthBuy : Theme.colors.depthSell,
                        shadowColor: changeColor,
                        shadowOpacity: 0.5,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 0 }
                    }
                ]}>
                    <Text style={[styles.change, { color: changeColor }]}>
                        {isPositive ? '+' : ''}{item.change24h.toFixed(2)}%
                    </Text>
                </View>
            </View>
        </AnimatedTouchableOpacity>
    );
};

export default function MarketsScreen({ navigation }: any) {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isReady, isPlaying } = useMarketStream();

  const fetchMarkets = async () => {
      if (!isReady) return;
      const db = await getDb();
      try {
          const rows = await db.getAllAsync<MarketRow>(`
            SELECT m.id, m.ticker, m.is_favorite,
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
    <View style={styles.container}>
      {/* Header Row */}
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
  container: { flex: 1, backgroundColor: Theme.colors.background },
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
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1
  },
  rowCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: Theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Theme.colors.surfaceHighlight,
      // Subtle shadow for depth
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
  },
  leftCol: {
      flex: 1,
      justifyContent: 'center'
  },
  rightCol: {
      alignItems: 'flex-end',
      justifyContent: 'center'
  },
  tickerRow: {
      marginBottom: 4
  },
  ticker: {
      fontSize: 16,
      fontWeight: '800', // Extra Bold
      color: Theme.colors.text,
      letterSpacing: 0.5
  },
  volRow: {
      flexDirection: 'row',
      alignItems: 'center'
  },
  subText: {
      color: Theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4
  },
  star: {
      fontSize: 18,
      marginRight: 4
  },
  price: {
      fontSize: 17,
      fontWeight: '700',
      color: Theme.colors.text,
      marginBottom: 6,
      fontVariant: ['tabular-nums'],
      letterSpacing: 0.5
  },
  changeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      minWidth: 70,
      alignItems: 'center'
  },
  change: {
      fontSize: 12,
      fontWeight: '700'
  }
});
