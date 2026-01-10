import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handlePlaceOrder = async (side: 'buy' | 'sell') => {
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
                  'INSERT INTO orders (id, market_id, side, price, amount, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [`${Date.now()}`, marketId, side, p, a, 'open', Date.now()]
              );
          });

          setPrice('');
          setAmount('');
          Alert.alert('Success', 'Order successfully placed locally');
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

              await db.runAsync('DELETE FROM orders WHERE id = ?', [order.id]);
          });
          Alert.alert('Success', 'Order cancelled');
          fetchOrders();
      } catch (e: any) {
          Alert.alert('Error', e.message);
      }
  };

  const renderItem = ({ item }: { item: OrderRow }) => (
      <View style={styles.card}>
          <View>
              <Text style={{fontWeight: 'bold', color: Theme.colors.text}}>{item.market_id} <Text style={{color: item.side === 'buy' ? Theme.colors.success : Theme.colors.error}}>{item.side.toUpperCase()}</Text></Text>
              <Text style={{color: Theme.colors.textSecondary}}>{item.amount} @ {item.price}</Text>
          </View>
          <Button title="Cancel" onPress={() => cancelOrder(item)} color={Theme.colors.error} />
      </View>
  );

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
    >
        <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.header}>Place Order ({marketId})</Text>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Price"
                    placeholderTextColor={Theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Amount"
                    placeholderTextColor={Theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                />

                <View style={styles.row}>
                    <View style={{flex: 1, marginRight: 5}}>
                         <Button title="Buy" onPress={() => handlePlaceOrder('buy')} color={Theme.colors.success} disabled={loading} />
                    </View>
                    <View style={{flex: 1, marginLeft: 5}}>
                         <Button title="Sell" onPress={() => handlePlaceOrder('sell')} color={Theme.colors.error} disabled={loading} />
                    </View>
                </View>
            </View>

            <Text style={[styles.header, { marginTop: 20 }]}>Open Orders</Text>
            {orders.length === 0 && <Text style={{textAlign: 'center', color: Theme.colors.textSecondary}}>No open orders</Text>}
            {orders.map(item => (
                <View key={item.id} style={{marginBottom: 10}}>
                   {renderItem({item})}
                </View>
            ))}
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background, paddingTop: 60 },
  scroll: { padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: Theme.colors.text },
  form: {
      backgroundColor: Theme.colors.surface,
      padding: 16,
      borderRadius: 12
  },
  input: {
      backgroundColor: Theme.colors.surfaceHighlight,
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      fontSize: 16,
      color: Theme.colors.text
  },
  row: { flexDirection: 'row' },
  card: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: Theme.colors.surface,
      borderWidth: 1,
      borderColor: Theme.colors.border,
      borderRadius: 8
  }
});
