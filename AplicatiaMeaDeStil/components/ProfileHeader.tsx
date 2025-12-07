import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export function ProfileHeader() {
  const { isAuthenticated, user } = useAuth();

  return (
    <View style={styles.header}>
      {isAuthenticated && user ? (
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')} 
          style={styles.profileButton}
        >
          <Ionicons name="person-circle" size={32} color="#007AFF" />
          <Text style={styles.profileButtonText} numberOfLines={1}>
            {user.email}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          onPress={() => router.push('/auth/login')} 
          style={styles.loginButton}
        >
          <Ionicons name="person-outline" size={20} color="#007AFF" />
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 100,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 250,
  },
  profileButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
