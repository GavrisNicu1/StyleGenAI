import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme'; // Or standard useColorScheme

interface ThemedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  loading?: boolean;
}

export function ThemedInput({
  label,
  error,
  containerStyle,
  rightIcon,
  onRightIconPress,
  loading,
  style,
  ...props
}: ThemedInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = Colors[isDark ? 'dark' : 'light'];
  
  // Gucci Input Style: 
  // Light Mode: Cream background, Navy text.
  // Dark Mode: Dark Green background, Cream text.
  const inputBg = isDark ? '#1A2C24' : '#FFFFFF'; 

  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? '#B01824' // Gucci Red for Error
    : isFocused
    ? '#C5A059' // Gucci Gold on Focus
    : isDark ? '#3E4E42' : '#CED4DA'; // Subtle border

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>}
      <View style={[styles.inputContainer, { borderColor, backgroundColor: inputBg }]}>
        <TextInput
          style={[styles.input, { color: themeColors.text }, style]} 
          placeholderTextColor={isDark ? '#8F9B94' : '#6C757D'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={'#B01824'} // Gucci Red Cursor
          {...props}
        />
        {(rightIcon || loading) && (
          <TouchableOpacity 
            onPress={onRightIconPress} 
            disabled={loading || !onRightIconPress}
            style={styles.rightIcon}
          >
            {loading ? <ActivityIndicator size="small" color={themeColors.secondary} /> : rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.9,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12, // Ensure good touch target
    height: '100%',
  },
  rightIcon: {
    marginLeft: 10,
    padding: 4,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
