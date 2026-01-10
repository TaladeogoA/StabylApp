import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from './src/constants/Theme';
import { useInitializeDb } from './src/db/useInitializeDb';
import RootNavigator from './src/navigation/RootNavigator';
import InspectorScreen from './src/screens/InspectorScreen';

export default function App() {
  const { isReady, error } = useInitializeDb();
  const [showInspector, setShowInspector] = useState(false);

  if (!isReady) {
      return (
          <View style={styles.container}>
              <ActivityIndicator size="large" />
          </View>
      );
  }

  if (error) {
    return (
        <View style={styles.container}>
            <Text style={{color: 'red'}}>DB Error: {error.message}</Text>
        </View>
    );
  }

  if (showInspector) {
     return (
         <SafeAreaView style={{flex: 1}}>
             <Button title="Close Inspector" onPress={() => setShowInspector(false)} />
             <InspectorScreen />
         </SafeAreaView>
     );
  }

  return (
    <View style={{flex: 1, backgroundColor: Theme.colors.background}}>
      <RootNavigator />

      {/* <View style={{ position: 'absolute', top: 50, right: 20, zIndex: 999 }}>
          <Button title="Debug" onPress={() => setShowInspector(true)} />
      </View> */}

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
