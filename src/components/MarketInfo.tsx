import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/Theme';

import { getDb } from '../db/schema';

export default function MarketInfo({ marketId }: { marketId: string }) {
  const [base, quote] = marketId.split('-');
  const [info, setInfo] = React.useState<any>(null);

  React.useEffect(() => {
      (async () => {
          const db = await getDb();
          const data = await db.getFirstAsync('SELECT * FROM markets WHERE id = ?', [marketId]);
          setInfo(data);
      })();
  }, [marketId]);

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
        <Text style={styles.sectionTitle}>Contract Specifications</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Base Asset</Text>
          <Text style={styles.statValue}>{info?.baseAsset || base}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Quote Asset</Text>
          <Text style={styles.statValue}>{info?.quoteAsset || quote}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Tick Size</Text>
          <Text style={styles.statValue}>{info?.tickSize || '-'}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Min Order Size</Text>
          <Text style={styles.statValue}>{info?.minOrderSize || '-'}</Text>
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
    fontFamily: Theme.typography.bold.fontFamily,
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
    fontFamily: Theme.typography.medium.fontFamily,
    fontVariant: ['tabular-nums'],
  },
});
