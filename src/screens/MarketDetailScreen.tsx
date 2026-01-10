import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MarketDetailScreen({ route }: any) {
  const { marketId } = route.params || {};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Market Detail: {marketId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
});
