import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { register } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSignup = async () => {
    setError('');
    
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Toate câmpurile sunt obligatorii.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }

    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Înregistrare eșuată. Încearcă din nou.');
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
          <ThemedText type="goldTitle" style={styles.title}>Creează Cont</ThemedText>
          <ThemedText style={styles.subtitle}>Începe călătoria ta de stil</ThemedText>
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
          />

          <ThemedInput
            label="Parolă"
            placeholder="Alegeți o parolă"
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

          <ThemedInput
            label="Confirmă Parola"
            placeholder="Reintroduceți parola"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />

          <ThemedButton 
            title="Înregistrare" 
            onPress={handleSignup} 
            loading={loading}
            style={styles.signupButton}
          />

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>Ai deja un cont? </ThemedText>
            <ThemedButton 
              title="Autentificare" 
              onPress={() => router.push('/auth/login')} 
              type="ghost"
              style={{ paddingVertical: 0, minHeight: 0 }}
              textStyle={{ color: Colors.light.primary, fontSize: 14 }}
            />
          </View>
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
  signupButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
