import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { Colors } from '@/constants/theme';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { register } = useAuth();
  
  const handleSignup = async () => {
    setError('');
    
    // Basic validtion
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
      console.log('Signup Error:', err);
      const errorMessage = typeof err === 'string' ? err : (err.message || 'Înregistrare eșuată. Încearcă din nou.');
      setError(errorMessage);
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <ThemedText type="title" style={styles.title}>Creează Cont</ThemedText>
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
              inputContainerStyle={styles.pillInput}
            />

            <ThemedInput
              label="Parolă"
              placeholder="Alegeți o parolă"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              inputContainerStyle={styles.pillInput}
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <ThemedInput
              label="Confirmă Parola"
              placeholder="Reintroduceți parola"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              inputContainerStyle={styles.pillInput}
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <View style={styles.spacer} />

            <ThemedButton 
              title={loading ? "Se creează contul..." : "Înregistrare"} 
              onPress={handleSignup} 
              loading={loading}
              style={styles.signupButton}
              textStyle={styles.signupButtonText}
            />

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>Ai deja un cont? </ThemedText>
              <ThemedButton 
                title="Autentificare" 
                onPress={() => router.push('/auth/login')} 
                type="ghost"
                style={styles.loginLinkButton}
                textStyle={styles.loginLinkText}
              />
            </View>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.secondary,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  formContainer: {
    width: '100%',
  },
  pillInput: {
    borderRadius: 30, // Pill styling
    paddingHorizontal: 20,
  },
  spacer: {
    height: 16,
  },
  signupButton: {
    marginTop: 16,
    marginBottom: 24,
    height: 54,
    borderRadius: 30,
    shadowColor: Colors.light.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
  },
  loginLinkButton: {
    paddingVertical: 4, 
    minHeight: 0,
    marginLeft: 4,
  },
  loginLinkText: {
    color: Colors.light.primary, 
    fontSize: 14, 
    fontWeight: 'bold',
  },
});
