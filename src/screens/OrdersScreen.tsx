import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeOutRight,
    Layout
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabSwitcher from '../components/TabSwitcher';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';

interface OrderRow {
    id: string;
    market_id: string;
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    status: string;
    timestamp: number;
}

export default function OrdersScreen() {
  const [marketId, setMarketId] = useState('USDT-NGN');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Open Orders');
  const insets = useSafeAreaInsets();

  const fetchOrders = async () => {
      const db = await getDb();
      const rows = await db.getAllAsync<OrderRow>('SELECT * FROM orders ORDER BY timestamp DESC');
      setOrders(rows);
  };

  useFocusEffect(
      useCallback(() => {
          fetchOrders();
      }, [])
  );

  const handlePlaceOrder = async () => {
      const p = parseFloat(price);
      const a = parseFloat(amount);
      if (isNaN(p) || isNaN(a) || p <= 0 || a <= 0) {
          Alert.alert('Error', 'Invalid price or amount');
          return;
      }

      setLoading(true);
      try {
          const db = await getDb();
          await db.withTransactionAsync(async () => {
              const parts = marketId.split('-');
              const base = parts[0];
              const quote = parts[1];

              const requiredAsset = side === 'buy' ? quote : base;
              const requiredAmount = side === 'buy' ? (p * a) : a;

              const balance = await db.getFirstAsync<{ available: number }>(
                  'SELECT available FROM balances WHERE asset = ?',
                  [requiredAsset]
              );

              if (!balance || balance.available < requiredAmount) {
                  throw new Error(`Insufficient ${requiredAsset} balance`);
              }

              await db.runAsync(
                  'UPDATE balances SET available = available - ?, locked = locked + ? WHERE asset = ?',
                  [requiredAmount, requiredAmount, requiredAsset]
              );

              await db.runAsync(
                  'INSERT INTO orders (market_id, side, price, amount, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                  [marketId, side, p, a, 'open', Date.now()]
              );
          });

          setPrice('');
          setAmount('');
          Alert.alert('Success', 'Order successfully placed');
          fetchOrders();
      } catch (e: any) {
          Alert.alert('Order Failed', e.message);
      } finally {
          setLoading(false);
      }
  };

  const cancelOrder = async (order: OrderRow) => {
      try {
          const db = await getDb();
          await db.withTransactionAsync(async () => {
              const parts = order.market_id.split('-');
              const base = parts[0];
              const quote = parts[1];

              const lockedAsset = order.side === 'buy' ? quote : base;
              const lockedAmount = order.side === 'buy' ? (order.price * order.amount) : order.amount;

              await db.runAsync(
                  'UPDATE balances SET available = available + ?, locked = locked - ? WHERE asset = ?',
                  [lockedAmount, lockedAmount, lockedAsset]
              );

              await db.runAsync('UPDATE orders SET status = "cancelled" WHERE id = ?', [order.id]);
          });
          // Alert.alert('Success', 'Order cancelled'); // Removed for smoother flow
          fetchOrders();
      } catch (e: any) {
          Alert.alert('Error', e.message);
      }
  };

  const filteredOrders = orders.filter(o =>
      activeTab === 'Open Orders' ? o.status === 'open' : o.status !== 'open'
  );

  const renderItem = ({ item, index }: { item: OrderRow, index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 50)}
        exiting={FadeOutRight}
        layout={Layout.springify()}
        style={styles.card}
      >
          <View style={styles.cardRow}>
              <View style={[styles.badge, { backgroundColor: item.side === 'buy' ? 'rgba(39, 196, 133, 0.2)' : 'rgba(255, 59, 48, 0.2)' }]}>
                  <Text style={[styles.badgeText, { color: item.side === 'buy' ? Theme.colors.buy : Theme.colors.sell }]}>
                      {item.side.toUpperCase()}
                  </Text>
              </View>
              <Text style={styles.marketText}>{item.market_id}</Text>
          </View>

          <View style={styles.detailsRow}>
              <View>
                  <Text style={styles.label}>Price</Text>
                  <Text style={styles.value}>{item.price}</Text>
              </View>
              <View>
                  <Text style={styles.label}>Amount</Text>
                  <Text style={styles.value}>{item.amount}</Text>
              </View>
              <View>
                   <Text style={[styles.statusText, { color: item.status === 'open' ? Theme.colors.accent : Theme.colors.textSecondary }]}>
                       {item.status.toUpperCase()}
                   </Text>
              </View>
          </View>

          {item.status === 'open' && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelOrder(item)}>
                  <Ionicons name="close-circle-outline" size={24} color={Theme.colors.textSecondary} />
              </TouchableOpacity>
          )}
      </Animated.View>
  );

  return (
    <View style={styles.container}>
        <View style={styles.backgroundContainer} />

        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: 100 }]}>

                {/* Glass Order Ticket */}
                <BlurView intensity={30} tint="dark" style={styles.ticket}>
                    <View style={styles.ticketHeader}>
                        <Text style={styles.ticketTitle}>Limit Order</Text>
                        <Text style={styles.ticketMarket}>{marketId}</Text>
                    </View>

                    {/* Segmented Control */}
                    <View style={styles.segmentContainer}>
                        <TouchableOpacity
                            style={[styles.segmentBtn, side === 'buy' && styles.segmentBtnActiveBuy]}
                            onPress={() => setSide('buy')}
                        >
                            <Text style={[styles.segmentText, side === 'buy' && styles.segmentTextActive]}>Buy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segmentBtn, side === 'sell' && styles.segmentBtnActiveSell]}
                            onPress={() => setSide('sell')}
                        >
                            <Text style={[styles.segmentText, side === 'sell' && styles.segmentTextActive]}>Sell</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Inputs */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Price (USDT)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor={Theme.colors.textSecondary}
                            keyboardType="numeric"
                            value={price}
                            onChangeText={setPrice}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Amount ({marketId.split('-')[0]})</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor={Theme.colors.textSecondary}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[
                            styles.actionBtn,
                            { backgroundColor: side === 'buy' ? Theme.colors.buy : Theme.colors.sell, opacity: loading ? 0.7 : 1 }
                        ]}
                        onPress={handlePlaceOrder}
                        disabled={loading}
                    >
                        <Text style={styles.actionBtnText}>
                            {side === 'buy' ? `Buy ${marketId.split('-')[0]}` : `Sell ${marketId.split('-')[0]}`}
                        </Text>
                    </TouchableOpacity>

                </BlurView>

                {/* Orders List */}
                <View style={{marginTop: 32}}>
                    <TabSwitcher
                        tabs={['Open Orders', 'History']}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </View>

                <View style={styles.listContainer}>
                    {filteredOrders.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="list-outline" size={48} color={Theme.colors.surfaceHighlight} />
                            <Text style={styles.emptyText}>No {activeTab.toLowerCase()}</Text>
                        </View>
                    )}
                    {filteredOrders.map((item, index) => (
                        <View key={item.id} style={{marginBottom: 12}}>
                            {renderItem({item, index})}
                        </View>
                    ))}
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  backgroundContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#050510' },
  scroll: { paddingHorizontal: 16 },

  ticket: {
      borderRadius: 24,
      overflow: 'hidden',
      padding: 24,
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
  },
  ticketHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
  },
  ticketTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text },
  ticketMarket: { fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary, letterSpacing: 1 },

  segmentContainer: {
      flexDirection: 'row',
      backgroundColor: '#1A1A24',
      borderRadius: 12,
      padding: 4,
      marginBottom: 24
  },
  segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
  },
  segmentBtnActiveBuy: { backgroundColor: Theme.colors.buy },
  segmentBtnActiveSell: { backgroundColor: Theme.colors.sell },
  segmentText: { color: Theme.colors.textSecondary, fontWeight: '600', fontSize: 14 },
  segmentTextActive: { color: '#fff' },

  inputGroup: { marginBottom: 16 },
  inputLabel: { color: Theme.colors.textSecondary, fontSize: 12, marginBottom: 8, marginLeft: 4 },
  input: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      color: '#fff',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)'
  },

  actionBtn: {
      marginTop: 8,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, textTransform: 'uppercase' },

  listContainer: { marginTop: 16 },

  card: {
      backgroundColor: Theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: Theme.colors.border,
      position: 'relative'
  },
  cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12
  },
  badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 12
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
  marketText: { color: Theme.colors.text, fontWeight: '700', fontSize: 14 },

  detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end'
  },
  label: { color: Theme.colors.textSecondary, fontSize: 12, marginBottom: 4 },
  value: { color: Theme.colors.text, fontSize: 15, fontWeight: '500', fontVariant: ['tabular-nums'] },

  statusText: { fontSize: 12, fontWeight: '700' },
  cancelBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
      padding: 4
  },

  emptyState: { alignItems: 'center', paddingVertical: 40, opacity: 0.5 },
  emptyText: { color: Theme.colors.textSecondary, marginTop: 12 }
});
