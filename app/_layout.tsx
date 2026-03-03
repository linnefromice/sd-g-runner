import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useSaveDataStore } from '@/stores/saveDataStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    useSaveDataStore.getState().load().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a14' }}>
        <ActivityIndicator size="large" color="#00e5ff" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a14' },
      }}
    />
  );
}
