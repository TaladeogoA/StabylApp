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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OrdersList from '../components/OrdersList';
import ScreenHeader from '../components/ScreenHeader';
import { Theme } from '../constants/Theme';
import { getDb } from '../db/schema';
import { OrderRow } from '../types';

export default function OrdersScreen() {
  const [marketId, setMarketId] = useState('USDT-NGN');
  const [markets, setMarkets] = useState<{id: string}[]>([]);
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Open Orders');
  const insets = useSafeAreaInsets();

  const fetchMarkets = async () => {
      const db = await getDb();
      const rows = await db.getAllAsync<{id: string}>('SELECT id FROM markets');
      setMarkets(rows);
  };


  const fetchOrders = async () => {
      const db = await getDb();
      const rows = await db.getAllAsync<OrderRow>('SELECT * FROM orders WHERE market_id = ? ORDER BY timestamp DESC', [marketId]);
      setOrders(rows);
  };

  useFocusEffect(
      useCallback(() => {
          fetchMarkets();
          fetchOrders();
      }, [marketId])
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
          fetchOrders();
      } catch (e: any) {
          Alert.alert('Error', e.message);
      }
  };



  return (


    <View style={styles.container}>
        <View style={styles.backgroundContainer} />
        <View style={{ paddingTop: insets.top }}>
            <ScreenHeader title="Trade" />
        </View>

        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}>

                <BlurView intensity={30} tint="dark" style={styles.ticket}>
                    <View style={styles.ticketHeader}>
                        <Text style={styles.ticketTitle}>Limit Order</Text>
                        <Text style={styles.ticketMarket}>{marketId}</Text>
                    </View>

                    <View style={styles.segmentContainer}>
                        <TouchableOpacity
                            style={[styles.segmentBtn, side === 'buy' && styles.segmentBtnActive]}
                            onPress={() => setSide('buy')}
                        >
                            <Text style={[styles.segmentText, side === 'buy' && styles.segmentTextActive]}>Buy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segmentBtn, side === 'sell' && styles.segmentBtnActive]}
                            onPress={() => setSide('sell')}
                        >
                            <Text style={[styles.segmentText, side === 'sell' && styles.segmentTextActive]}>Sell</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        {markets.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                onPress={() => setMarketId(m.id)}
                                style={[
                                    styles.marketPill,
                                    marketId === m.id && styles.marketPillActive,
                                    { borderColor: marketId === m.id ? Theme.colors.accent : Theme.colors.surfaceHighlight }
                                ]}
                            >
                                <Text style={[
                                    styles.marketPillText,
                                    marketId === m.id && { color: '#fff', fontFamily: Theme.typography.bold.fontFamily }
                                ]}>
                                    {m.id}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Price ({marketId.split('-')[1]})</Text>
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

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
                        <Text style={{ color: Theme.colors.textSecondary, fontSize: 13, fontFamily: Theme.typography.medium.fontFamily }}>Total</Text>
                        <Text style={{ color: Theme.colors.text, fontSize: 13, fontFamily: Theme.typography.bold.fontFamily }}>
                            ≈ {((parseFloat(price) || 0) * (parseFloat(amount) || 0)).toFixed(2)} {marketId.split('-')[1]}
                        </Text>
                    </View>

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

                <OrdersList
                    orders={orders}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onCancel={cancelOrder}
                />

            </ScrollView>
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: Theme.colors.background
},
backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050510'
},
scroll: {
    paddingHorizontal: 16
},
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
ticketTitle: {
    fontSize: 18,
    fontFamily: Theme.typography.bold.fontFamily,
    color: Theme.colors.text
},
ticketMarket: {
    fontSize: 14,
    fontFamily: Theme.typography.medium.fontFamily,
    color: Theme.colors.textSecondary,
    letterSpacing: 1
},
marketPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.05)'
},
marketPillActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
},
marketPillText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontFamily: Theme.typography.medium.fontFamily
},
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
segmentBtnActive: {
    backgroundColor: Theme.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
},
segmentText: {
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.medium.fontFamily,
    fontSize: 14
},
segmentTextActive: {
    color: '#fff'
},

inputGroup: {
    marginBottom: 16
},
inputLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4
},
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
actionBtnText: {
    color: '#fff',
    fontFamily: Theme.typography.bold.fontFamily,
    fontSize: 16,
    textTransform: 'uppercase'
}
});
