import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/Theme';
import { useMarketStream } from '../hooks/useMarketStream';

interface StreamControlsProps {
    size?: number;
    color?: string;
}

export const StreamControls: React.FC<StreamControlsProps> = ({
    size = 28,
    color = Theme.colors.accent
}) => {
    const { status, togglePlay, replay } = useMarketStream();

    return (
        <TouchableOpacity
            onPress={status === 'finished' ? replay : togglePlay}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Ionicons
                name={
                    status === 'finished'
                        ? 'refresh-circle'
                        : status === 'playing'
                        ? 'pause-circle'
                        : 'play-circle'
                }
                size={size}
                color={color}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    iconButton: {
        padding: 4,
    },
});
