import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/constants/config';
import { Colors } from '@/constants/theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  };

  const handleRequestReset = async () => {
    setError('');

    if (!email.trim()) {
      setError('Te rugăm să introduci adresa de email.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Te rugăm să introduci o adresă de email validă.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setEmailSent(true);
      } else {
        setError(data.message || 'Nu s-a putut procesa cererea.');
      }
    } catch (requestError: any) {
      setError(requestError?.message || 'Nu s-a putut trimite cererea. Verifică conexiunea.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleRequestReset();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.headerContainer}>
          <ThemedText style={styles.emoji}>{emailSent ? '📧' : '🔐'}</ThemedText>
          <ThemedText type="title" style={styles.title}>
            {emailSent ? 'Verifică-ți email-ul' : 'Ai uitat parola?'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {emailSent
              ? 'Am trimis un link de resetare la adresa introdusă. Verifică și folderul Spam.'
              : 'Introdu adresa de email și îți trimitem un link pentru resetarea parolei.'}
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          {!emailSent ? (
            <>
              {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
              <ThemedInput
                label="Email"
                placeholder="Introduceți adresa de email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                autoCorrect={false}
                editable={!loading}
                inputContainerStyle={styles.pillInput}
              />

              <ThemedButton
                title={loading ? 'Se trimite...' : 'Trimite link de resetare'}
                onPress={handleRequestReset}
                loading={loading}
                style={styles.primaryButton}
                textStyle={styles.primaryButtonText}
              />

              <ThemedButton
                title="Înapoi la autentificare"
                onPress={() => router.replace('/auth/login')}
                type="ghost"
                style={styles.backButton}
                textStyle={styles.backButtonText}
              />
            </>
          ) : (
            <>
              <View style={styles.successCard}>
                <ThemedText style={styles.successText}>
                  Link-ul de resetare expiră după 1 oră pentru securitatea contului tău.
                </ThemedText>
              </View>

              <ThemedButton
                title={loading ? 'Se trimite...' : 'Retrimite email-ul'}
                onPress={handleResendEmail}
                loading={loading}
                type="secondary"
                style={styles.secondaryButton}
              />

              <ThemedButton
                title="Înapoi la autentificare"
                onPress={() => router.replace('/auth/login')}
                type="outline"
              />
            </>
          )}
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
    marginBottom: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
    color: '#555',
    maxWidth: 380,
  },
  formContainer: {
    width: '100%',
  },
  pillInput: {
    borderRadius: 30,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    marginTop: 6,
    marginBottom: 14,
    height: 54,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  backButton: {
    alignSelf: 'center',
    minHeight: 0,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  successCard: {
    backgroundColor: '#E9ECE6',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  successText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
  },
  secondaryButton: {
    marginBottom: 14,
  },
});
