import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MarketRowItem from '../components/MarketRowItem';
import ScreenHeader from '../components/ScreenHeader';
import { StreamControls } from '../components/StreamControls';
import { Theme } from '../constants/Theme';
import { fetchMarketSummaries } from '../db/marketQueries';
import { getDb } from '../db/schema';
import { useMarketStream } from '../hooks/useMarketStream';
import { MarketRow } from '../types';

export default function MarketsScreen({ navigation }: any) {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isReady } = useMarketStream();
  const insets = useSafeAreaInsets();

  const fetchMarkets = async () => {
      if (!isReady) return;
      const db = await getDb();
      try {
          const marketStats = await fetchMarketSummaries(db);
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
          rightElement={<StreamControls size={24} />}
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
