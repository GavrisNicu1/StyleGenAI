import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import LoadingTShirt from '@/components/LoadingTShirt';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Ensure error is string
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
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Login Error:', err);
      // Ensure we display a string
      const errorMessage = typeof err === 'string' ? err : (err.message || 'Autentificare eșuată. Verifică datele.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.headerContainer}>
          <LoadingTShirt /> 
          <ThemedText type="title" style={styles.title}>StyleGenAI</ThemedText>
          <ThemedText style={styles.subtitle}>Elegance powered by Intelligence</ThemedText>
        </View>

        <View style={styles.formContainer}>
          {error ? (
            <ThemedText style={styles.errorText}>
              {error}
            </ThemedText>
          ) : null}

          <ThemedInput
            label="Email"
            placeholder="Introduceți adresa de email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            inputContainerStyle={styles.pillInput}
          />

          <ThemedInput
            label="Parolă"
            placeholder="Introduceți parola"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            inputContainerStyle={styles.pillInput}
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <View style={styles.spacer} />

          <ThemedButton 
            title={loading ? "Se autentifică..." : "Autentificare"}
            onPress={handleLogin} 
            loading={loading}
            style={styles.loginButton}
            textStyle={styles.loginButtonText}
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
            type="outline" // This now supports gold/tint color on dark mode
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
  title: {
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary, 
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.secondary, 
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  formContainer: {
    width: '100%',
  },
  pillInput: {
    borderRadius: 30, // True pill shape
    paddingHorizontal: 20,
  },
  spacer: {
    height: 16,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 16,
    height: 54, // Taller button
    shadowColor: Colors.light.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  forgotButton: {
    alignSelf: 'center',
    marginBottom: 24,
    minHeight: 0,
    paddingVertical: 4,
  },
  forgotButtonText: {
    fontSize: 14,
    fontWeight: '500', 
    opacity: 0.7,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.2,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
