import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLogin = async () => {
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Te rugăm să introduci email-ul și parola.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigation is handled by the AuthContext or layout usually, but for safety:
      router.replace('/(tabs)');
    } catch (err: any) {
      setError('Autentificare eșuată. Verifică datele introduse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerContainer}>
          <Ionicons name="shirt" size={60} color={Colors.light.secondary} style={styles.logoIcon} />
          <ThemedText type="goldTitle" style={styles.title}>StyleGenAI</ThemedText>
          <ThemedText style={styles.subtitle}>Bine ai revenit!</ThemedText>
        </View>

        <View style={styles.formContainer}>
          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <ThemedInput
            label="Email"
            placeholder="Introduceți adresa de email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            // leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.light.icon} />}
            error={error && !email ? 'Câmp obligatoriu' : undefined}
          />

          <ThemedInput
            label="Parolă"
            placeholder="Introduceți parola"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={Colors.light.icon} 
              />
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <ThemedButton 
            title="Autentificare" 
            onPress={handleLogin} 
            loading={loading}
            style={styles.loginButton}
          />

          <ThemedButton 
            title="Ai uitat parola?" 
            onPress={() => router.push('/auth/forgot-password')} 
            type="ghost"
            style={styles.forgotButton}
            textStyle={styles.forgotButtonText}
          />

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
            <ThemedText style={styles.dividerText}>sau</ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
          </View>

          <ThemedButton 
            title="Creează cont nou" 
            onPress={() => router.push('/auth/signup')} 
            type="outline"
          />
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    marginBottom: 16,
    shadowColor: Colors.light.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  forgotButton: {
    alignSelf: 'center',
    marginBottom: 24,
    minHeight: 0,
    paddingVertical: 8,
  },
  forgotButtonText: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.6,
  },
});
