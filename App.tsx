import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useInitializeDb } from './src/db/useInitializeDb';
import InspectorScreen from './src/screens/InspectorScreen';

export default function App() {
  const { isReady, error } = useInitializeDb();
  const [showInspector, setShowInspector] = useState(false);

  if (!isReady) {
      return (
          <View style={styles.container}>
              <ActivityIndicator size="large" />
              <Text>Initializing DB...</Text>
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
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>

      {/* DEBUG BUTTON */}
      <View style={{ marginTop: 20 }}>
          <Button title="Debug DB" onPress={() => setShowInspector(true)} />
      </View>

      <StatusBar style="auto" />
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
