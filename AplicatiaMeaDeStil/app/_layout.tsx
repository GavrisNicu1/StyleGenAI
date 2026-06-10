import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // În unele configurații dev, modulul de "keep awake" poate arunca
  // o promisiune nerecuperată. Activăm/suprimăm în mod sigur, doar în dev.
  useEffect(() => {
    if (!__DEV__) return;
    let cancelled = false;
    (async () => {
      try {
        const mod: any = await import('expo-keep-awake');
        if (cancelled) return;
        if (typeof mod.activateKeepAwakeAsync === 'function') {
          await mod.activateKeepAwakeAsync('dev-keep-awake');
        } else if (typeof mod.useKeepAwake === 'function') {
          // Hook-ul nu poate fi folosit aici, ignorăm liniștit.
        }
      } catch {
        // Ignorăm – pe unele device-uri modulul poate lipsi sau nu poate fi activat.
      }
    })();
    return () => {
      cancelled = true;
      (async () => {
        try {
          const mod: any = await import('expo-keep-awake');
          if (typeof mod.deactivateKeepAwake === 'function') {
            await mod.deactivateKeepAwake('dev-keep-awake');
          }
        } catch {}
      })();
    };
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
          <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
