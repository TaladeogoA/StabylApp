import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Theme } from '../constants/Theme';
import { MarketRow } from '../types';

interface MarketRowItemProps {
    item: MarketRow;
    navigation: any;
    toggleFavorite: (id: string) => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const MarketRowItem = ({ item, navigation, toggleFavorite }: MarketRowItemProps) => {
    const scale = useSharedValue(1);
    const starScale = useSharedValue(1);

    const rStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const rStarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: starScale.value }]
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.98, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const handleFavorite = () => {
        starScale.value = withSequence(
            withSpring(1.5),
            withSpring(1)
        );
        toggleFavorite(item.id);
    };

    const isPositive = item.change24h >= 0;
    const changeColor = isPositive ? Theme.colors.buy : Theme.colors.sell;

    return (
        <AnimatedTouchableOpacity
            style={[styles.rowCard, rStyle]}
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate('MarketDetail', { marketId: item.id })}
        >
            <View style={styles.leftCol}>
                <View style={styles.tickerRow}>
                    <Text style={styles.ticker}>{item.ticker.replace('-', ' / ')}</Text>
                </View>
                <View style={styles.volRow}>
                    <TouchableOpacity onPress={handleFavorite} hitSlop={10}>
                        <Animated.Text style={[styles.star, rStarStyle, { color: item.is_favorite ? Theme.colors.accent : Theme.colors.textSecondary }]}>
                            {item.is_favorite ? '★' : '☆'}
                        </Animated.Text>
                    </TouchableOpacity>
                    <Text style={styles.subText}>Vol $24.5M</Text>
                </View>
            </View>

            <View style={styles.rightCol}>
                <Text style={styles.price}>{item.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <View style={[
                    styles.changeBadge,
                    {
                        borderColor: changeColor,
                        backgroundColor: isPositive ? Theme.colors.depthBuy : Theme.colors.depthSell,
                        shadowColor: changeColor,
                        shadowOpacity: 0.5,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 0 }
                    }
                ]}>
                    <Text style={[styles.change, { color: changeColor }]}>
                        {isPositive ? '+' : ''}{item.change24h.toFixed(2)}%
                    </Text>
                </View>
            </View>
        </AnimatedTouchableOpacity>
    );
};

const styles = StyleSheet.create({
    rowCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        backgroundColor: Theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.colors.surfaceHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    leftCol: {
        flex: 1,
        justifyContent: 'center'
    },
    rightCol: {
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    tickerRow: {
        marginBottom: 4
    },
    ticker: {
        fontSize: 16,
        fontFamily: Theme.typography.brand.fontFamily,
        color: Theme.colors.text,
        letterSpacing: 0.5
    },
    volRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    subText: {
        color: Theme.colors.textSecondary,
        fontSize: 12,
        fontFamily: Theme.typography.medium.fontFamily,
        marginLeft: 4
    },
    star: {
        fontSize: 18,
        marginRight: 4
    },
    price: {
        fontSize: 17,
        fontFamily: Theme.typography.bold.fontFamily,
        color: Theme.colors.text,
        marginBottom: 6,
        fontVariant: ['tabular-nums'],
        letterSpacing: 0.5
    },
    changeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        minWidth: 70,
        alignItems: 'center'
    },
    change: {
        fontSize: 12,
        fontFamily: Theme.typography.bold.fontFamily
    }
});

export default MarketRowItem;
