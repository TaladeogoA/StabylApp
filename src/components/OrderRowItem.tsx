import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutRight, Layout } from 'react-native-reanimated';
import { Theme } from '../constants/Theme';
import { OrderRow } from '../types';

interface OrderRowProps {
    item: OrderRow;
    index: number;
    onCancel: (order: OrderRow) => void;
}

const OrderRowItem = ({ item, index, onCancel }: OrderRowProps) => {
    return (
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
                <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(item)}>
                    <Ionicons name="close-circle-outline" size={24} color={Theme.colors.textSecondary} />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        position: 'relative',
        marginBottom: 12
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
    badgeText: { fontSize: 12, fontFamily: Theme.typography.brand.fontFamily },
    marketText: { color: Theme.colors.text, fontFamily: Theme.typography.bold.fontFamily, fontSize: 14 },

    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    label: { color: Theme.colors.textSecondary, fontSize: 12, marginBottom: 4 },
    value: { color: Theme.colors.text, fontSize: 15, fontFamily: Theme.typography.medium.fontFamily, fontVariant: ['tabular-nums'] },

    statusText: { fontSize: 12, fontFamily: Theme.typography.bold.fontFamily },
    cancelBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 4
    },
});

export default OrderRowItem;
