import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrderBook from '../components/OrderBook';
import RecentTrades from '../components/RecentTrades';
import TabSwitcher from '../components/TabSwitcher';
import { Theme } from '../constants/Theme';
import { useMarketStream } from '../hooks/useMarketStream';

export default function MarketDetailScreen({ route, navigation }: any) {
  const { marketId } = route.params || { marketId: 'USDT-NGN' };
  const { isPlaying, togglePlay } = useMarketStream();
  const [activeTab, setActiveTab] = useState('Order Book');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{marketId}</Text>

          <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
              <Text style={styles.playText}>{isPlaying ? "Pause" : "Play"}</Text>
          </TouchableOpacity>
      </View>

      <TabSwitcher
         tabs={['Order Book', 'Trades']}
         activeTab={activeTab}
         onTabChange={setActiveTab}
      />

      <View style={styles.content}>
          {activeTab === 'Order Book' ? (
              <OrderBook marketId={marketId} />
          ) : (
              <ScrollView>
                 <RecentTrades marketId={marketId} />
              </ScrollView>
          )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Theme.colors.surfaceHighlight,
      backgroundColor: Theme.colors.surface
  },
  backButton: {
      padding: 8,
  },
  backText: {
      color: Theme.colors.primary,
      fontWeight: '600',
      fontSize: 16
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Theme.colors.text
  },
  playButton: {
      padding: 8,
      backgroundColor: Theme.colors.surfaceHighlight,
      borderRadius: 6
  },
  playText: {
      color: Theme.colors.primary,
      fontWeight: '600',
      fontSize: 14
  },
  content: { flex: 1 }
});
