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
          <Ionicons name="person-circle" size={24} color="#115740" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          onPress={() => router.push('/auth/login')} 
          style={styles.loginButton}
        >
          <Ionicons name="person-outline" size={20} color="#115740" />
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
    borderColor: '#C5A059', // Gold
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 250,
  },
  profileButtonText: {
    color: '#115740', // Green
    fontWeight: '600',
    fontSize: 13,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 20, // Smaller circle
    borderWidth: 1,
    borderColor: '#C5A059', // Gucci Gold
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 36,
    minHeight: 36,
  },
  loginText: {
    color: '#115740', // Green
    fontWeight: '600',
  },
});
