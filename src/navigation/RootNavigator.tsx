import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet } from 'react-native';

import GlassTabBar from '../components/GlassTabBar';
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
    notification: Theme.colors.accent,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
       tabBar={(props) => <GlassTabBar {...props} />}
       screenOptions={{
           headerTransparent: true,
           headerStyle: {
               backgroundColor: 'transparent',
           },
           headerBackground: () => (
               <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
           ),
           headerTintColor: Theme.colors.text,
           headerTitleStyle: {
               fontFamily: Theme.typography.brand.fontFamily,
               letterSpacing: Theme.typography.brand.letterSpacing
           },
       }}
    >
      <Tab.Screen name="Markets" component={MarketsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={MyDarkTheme}>
      <Stack.Navigator screenOptions={{
           headerTransparent: true,
           headerStyle: {
               backgroundColor: 'transparent',
           },
           headerBackground: () => (
               <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
           ),
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
