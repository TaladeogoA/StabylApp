import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Theme';

interface TabSwitcherProps {
    tabs: string[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function TabSwitcher({ tabs, activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <View style={styles.container}>
      {tabs.map(tab => {
          const isActive = tab === activeTab;
          return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => onTabChange(tab)}
              >
                  <Text style={[styles.text, isActive && styles.activeText]}>{tab}</Text>
                  {isActive && <View style={styles.indicator} />}
              </TouchableOpacity>
          );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: Theme.colors.border,
      backgroundColor: Theme.colors.background,
  },
  tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      position: 'relative'
  },
  activeTab: {
  },
  text: {
      color: Theme.colors.textSecondary,
      fontWeight: '600',
      fontSize: 14
  },
  activeText: {
      color: Theme.colors.text,
      fontWeight: 'bold'
  },
  indicator: {
      position: 'absolute',
      bottom: 0,
      width: '60%',
      height: 3,
      backgroundColor: Theme.colors.primary,
      borderRadius: 2
  }
});
