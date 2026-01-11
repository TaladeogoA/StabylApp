import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Theme } from '../constants/Theme';
import { WalletRow } from '../types';

interface WalletRowProps {
    item: WalletRow;
    index: number;
}

const WalletRowItem = ({ item, index }: WalletRowProps) => {
    const total = item.available + item.locked;
    const formattedTotal = total.toLocaleString(undefined, { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals });
    const usdtVal = item.usdtValue?.toLocaleString(undefined, { maximumFractionDigits: 2 });

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            exiting={FadeOutUp}
            layout={LinearTransition.springify()}
            style={{ marginBottom: 12 }}
        >
            <BlurView intensity={20} tint="dark" style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.assetInfo}>
                        <View style={[styles.iconCircle, { backgroundColor: Theme.colors.background }]}>
                            <Text style={styles.iconText}>{item.asset[0]}</Text>
                        </View>
                        <View>
                            <Text style={styles.assetSymbol}>{item.asset}</Text>
                            <Text style={styles.assetName}>Asset</Text>
                        </View>
                    </View>
                    <View style={styles.valueInfo}>
                        <Text style={styles.usdtValue}>{formattedTotal} {item.asset}</Text>
                        <Text style={styles.amountValue}>≈ ${usdtVal}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsRow}>
                    <View>
                        <Text style={styles.label}>Available</Text>
                        <Text style={styles.subValue}>{item.available.toLocaleString(undefined, { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals })}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.label}>Locked</Text>
                        <Text style={styles.subValue}>{item.locked.toLocaleString(undefined, { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals })}</Text>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 20,
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        overflow: 'hidden'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    assetInfo: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    iconText: {
        fontSize: 18,
        fontFamily: Theme.typography.bold.fontFamily,
        color: Theme.colors.text
    },
    assetSymbol: {
        fontSize: 16,
        fontFamily: Theme.typography.bold.fontFamily,
        color: '#fff'
    },
    assetName: {
        fontSize: 12,
        color: Theme.colors.textSecondary
    },
    valueInfo: {
        alignItems: 'flex-end'
    },
    usdtValue: {
        fontSize: 16,
        fontFamily: Theme.typography.bold.fontFamily,
        color: '#fff'
    },
    amountValue: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        marginTop: 2
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: 16
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    label: {
        fontSize: 11,
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 4
    },
    subValue: {
        fontSize: 14,
        fontFamily: Theme.typography.medium.fontFamily,
        color: Theme.colors.text
    }
});

export default WalletRowItem;
