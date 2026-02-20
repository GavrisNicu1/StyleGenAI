import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/constants/config';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Eroare', 'Te rugăm să introduci adresa de email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Eroare', 'Te rugăm să introduci o adresă de email validă');
      return;
    }

    setLoading(true);
    try {
      console.log('[FORGOT_PASSWORD] Requesting password reset for:', email);
      
      const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      console.log('[FORGOT_PASSWORD] Response:', data);

      if (data.status === 'success') {
        setEmailSent(true);
      } else {
        Alert.alert('Eroare', data.message || 'Nu s-a putut procesa cererea');
      }
    } catch (error: any) {
      console.error('[FORGOT_PASSWORD] Error:', error);
      Alert.alert('Eroare', 'Nu s-a putut trimite cererea. Verifică conexiunea.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleRequestReset();
  };

  // Success state - email was sent
  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>📧</Text>
          </View>
          <Text style={styles.title}>Verifică-ți email-ul!</Text>
          <Text style={styles.subtitle}>
            Am trimis un link de resetare la{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Text style={styles.infoText}>
            Verifică inbox-ul și folder-ul de spam.{'\n'}
            Link-ul este valid pentru 1 oră.
          </Text>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleResendEmail}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>
                {loading ? 'Se trimite...' : '🔄 Retrimite email-ul'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/auth/login')}
            >
              <Text style={styles.buttonText}>← Înapoi la autentificare</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Default state - email input form
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.lockEmoji}>🔐</Text>
        </View>
        <Text style={styles.title}>Ai uitat parola?</Text>
        <Text style={styles.subtitle}>
          Introdu adresa de email și îți vom trimite un link pentru a-ți reseta parola în siguranță.
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Adresa ta de email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRequestReset}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Se trimite...' : '📧 Trimite link de resetare'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Text style={styles.link}>← Înapoi la autentificare</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Link-ul de resetare expiră după 1 oră pentru securitatea contului tău.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  lockEmoji: {
    fontSize: 60,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailHighlight: {
    color: '#007AFF',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  securityNote: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
  },
  securityText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
