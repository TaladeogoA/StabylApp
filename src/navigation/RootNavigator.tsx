import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { Theme } from '../constants/Theme';
import MarketDetailScreen from '../screens/MarketDetailScreen';
import MarketsScreen from '../screens/MarketsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import WalletScreen from '../screens/WalletScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Theme.colors.primary,
    background: Theme.colors.background,
    card: Theme.colors.surface,
    text: Theme.colors.text,
    border: Theme.colors.border,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
       screenOptions={{
           headerStyle: { backgroundColor: Theme.colors.surface },
           headerTintColor: Theme.colors.text,
           tabBarStyle: { backgroundColor: Theme.colors.surface, borderTopColor: Theme.colors.border },
           tabBarActiveTintColor: Theme.colors.primary,
           tabBarInactiveTintColor: Theme.colors.textSecondary,
       }}
    >
      <Tab.Screen name="Markets" component={MarketsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={MyDarkTheme}>
      <Stack.Navigator screenOptions={{
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: Theme.colors.text,
      }}>
        <Stack.Screen
          name="Root"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MarketDetail"
          component={MarketDetailScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
