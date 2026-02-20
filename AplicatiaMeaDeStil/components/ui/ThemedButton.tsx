import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

type ButtonType = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';

export interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  type?: ButtonType;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
}

export function ThemedButton({
  title,
  onPress,
  type = 'primary',
  style,
  textStyle,
  icon,
  loading = false,
  disabled = false,
}: ThemedButtonProps) {
  const theme = useThemeColor({}, 'background'); // Just to triger re-render on theme change if needed
  // We'll use direct color references from Colors based on the user's preference for Emerald/Gold
  // Note: For simplicity in this specific "luxury" request, we might force some colors 
  // or adapt them to light/dark modes using the hooks if we wanted full adaptability.
  // But the request specified Emerald & Gold specifically.
  
  const isDark = theme === '#121212'; // Rough check or use useColorScheme

  const getColors = () => {
    switch (type) {
      case 'primary':
        return {
          // Gucci Green Gradient or Solid Green
          // Using a subtle gradient from Dark Green to slightly lighter Green
          background: ['#115740', '#1A6B52'] as const, 
          text: '#F7F5F0', // Cream Text on Green Button
          icon: '#F7F5F0',
          border: 'transparent'
        };
      case 'secondary':
        return {
          // Gucci Red Gradient
          background: ['#8B131D', '#B01824'] as const, 
          text: '#F7F5F0', // Cream Text on Red Button
          icon: '#F7F5F0',
          border: 'transparent'
        };
      case 'tertiary':
        return {
          // Gucci Navy Blue Gradient
          background: ['#1E2A3B', '#2C3E50'] as const,
          text: '#F7F5F0', // Cream Text on Blue Button
          icon: '#F7F5F0',
          border: 'transparent'
        };
      case 'outline':
        return {
          background: ['transparent', 'transparent'] as const,
          text: '#115740', // Deep Green Text
          icon: '#115740',
          border: '#C5A059' // Gold Border
        };
      case 'ghost':
        return {
          background: ['transparent', 'transparent'] as const,
          text: '#1E2A3B', // Navy Blue Text
          icon: '#1E2A3B',
          border: 'transparent'
        };
      default:
        return {
          background: ['#115740', '#1A6B52'] as const,
          text: '#F7F5F0',
          icon: '#F7F5F0',
          border: 'transparent'
        };
    }
  };

  const colors = getColors();

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={colors.icon} style={styles.icon} />}
          <Text style={[styles.text, { color: colors.text }, textStyle]}>{title}</Text>
        </>
      )}
    </View>
  );

  if (type === 'outline' || type === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        disabled={loading || disabled}
        style={[
          styles.button,
          { 
            backgroundColor: 'transparent',
            borderColor: colors.border,
            borderWidth: type === 'outline' ? 1.5 : 0,
            opacity: disabled ? 0.6 : 1
          },
          style,
        ]}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={loading || disabled}
      style={[styles.container, { opacity: disabled ? 0.7 : 1 }, style]}
    >
      <LinearGradient
        colors={colors.background as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        {renderContent()}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
  },
});
