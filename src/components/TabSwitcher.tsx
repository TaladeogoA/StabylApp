import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Theme';

interface TabItem {
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface TabSwitcherProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function TabSwitcher({ tabs, activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <View style={styles.container}>
      {tabs.map(tab => {
          const isActive = tab.key === activeTab;
          return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => onTabChange(tab.key)}
              >
                  <Ionicons
                    name={tab.icon}
                    size={20}
                    color={isActive ? Theme.colors.accent : Theme.colors.textSecondary}
                  />
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
      fontFamily: Theme.typography.medium.fontFamily,
      fontSize: 14
  },
  activeText: {
      color: Theme.colors.text,
      fontFamily: Theme.typography.bold.fontFamily
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
