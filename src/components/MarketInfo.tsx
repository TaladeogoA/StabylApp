import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/Theme';

export default function MarketInfo({ marketId }: { marketId: string }) {
  const [base, quote] = marketId.split('-');

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About {base}</Text>
        <Text style={styles.description}>
          {base} is a digital asset exchanged for {quote}. This market represents the spot exchange rate determined by supply and demand.
          Stabyl provides a secure and reliable matching engine for this pair.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Statistics</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>24h Volume</Text>
          <Text style={styles.statValue}>1,245,392.55 {quote}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Market Cap</Text>
          <Text style={styles.statValue}>$420.5M</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Circulating Supply</Text>
          <Text style={styles.statValue}>125,000,000 {base}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>All Time High</Text>
          <Text style={styles.statValue}>$1,250.00</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  statLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
