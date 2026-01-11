import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme } from '../constants/Theme';

interface ScreenHeaderProps {
    title: string;
    rightElement?: React.ReactNode;
    style?: ViewStyle;
}

export default function ScreenHeader({ title, rightElement, style }: ScreenHeaderProps) {
    return (
        <View style={[styles.container, style]}>
            <Text style={styles.title}>{title}</Text>
            {rightElement && <View>{rightElement}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        color: Theme.colors.text,
        fontSize: 28,
        fontFamily: Theme.typography.brand.fontFamily,
    }
});
