import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function MarketsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Markets</Text>
      <Button
        title="Go to Detail (USDT-NGN)"
        onPress={() => navigation.navigate('MarketDetail', { marketId: 'USDT-NGN' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});
