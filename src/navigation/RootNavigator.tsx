import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import MarketDetailScreen from '../screens/MarketDetailScreen';
import MarketsScreen from '../screens/MarketsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import WalletScreen from '../screens/WalletScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Markets" component={MarketsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Root"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MarketDetail"
          component={MarketDetailScreen}
          options={({ route }: any) => ({ title: route.params?.marketId || 'Market Detail' })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
