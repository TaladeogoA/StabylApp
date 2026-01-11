import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts
} from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Theme } from './src/constants/Theme';
import { useInitializeDb } from './src/db/useInitializeDb';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const { isReady, error } = useInitializeDb();
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!isReady || !fontsLoaded) {
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

  return (
    <View style={{flex: 1, backgroundColor: Theme.colors.background}}>
      <RootNavigator />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
