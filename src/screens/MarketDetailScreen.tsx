import React, { useLayoutEffect } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import OrderBook from '../components/OrderBook';
import RecentTrades from '../components/RecentTrades';
import { useMarketStream } from '../hooks/useMarketStream';

export default function MarketDetailScreen({ route, navigation }: any) {
  const { marketId } = route.params || { marketId: 'USDT-NGN' };
  const { isPlaying, togglePlay } = useMarketStream();

  useLayoutEffect(() => {
      navigation.setOptions({
          headerRight: () => (
              <Button title={isPlaying ? "Pause" : "Play"} onPress={togglePlay} />
          )
      });
  }, [navigation, isPlaying]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{marketId}</Text>

      {/* 2 Column Layout for Tablet? Or Stacked for Mobile? Stacked is safer for now */}
      <View style={styles.row}>
         <View style={{flex: 1}}>
             <OrderBook marketId={marketId} />
         </View>
      </View>

      <RecentTrades marketId={marketId} />

      <View style={{height: 100}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  row: { flexDirection: 'row' }
});
