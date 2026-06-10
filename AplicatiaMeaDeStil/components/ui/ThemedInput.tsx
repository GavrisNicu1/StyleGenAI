import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text, TouchableOpacity, ActivityIndicator, ViewStyle, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ThemedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  loading?: boolean;
}

type ReadonlyThemedInputProps = Readonly<ThemedInputProps>;

export function ThemedInput({
  label,
  error,
  containerStyle,
  inputContainerStyle,
  rightIcon,
  onRightIconPress,
  loading,
  style,
  ...props
}: ReadonlyThemedInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = Colors[isDark ? 'dark' : 'light'];
  
  const [isFocused, setIsFocused] = useState(false);

  // Determine styles based on state
  let borderColor = 'transparent';
  if (error) {
    borderColor = '#D32F2F';
  } else if (isFocused) {
    borderColor = themeColors.tint;
  }

  const backgroundColor = isDark ? '#1E1E1E' : '#FFFFFF';
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>}
      
      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor,
          borderColor,
          borderWidth: isFocused || error ? 1.5 : 0, 
        },
        inputContainerStyle
      ]}>
        <TextInput
          style={[styles.input, { color: themeColors.text }, style]} 
          placeholderTextColor={isDark ? '#888' : '#999'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={themeColors.tint}
          {...props}
        />
        
        {(rightIcon || loading) && (
          <TouchableOpacity 
            onPress={onRightIconPress} 
            disabled={loading || !onRightIconPress}
            style={styles.iconContainer}
          >
            {loading ? (
              <ActivityIndicator size="small" color={themeColors.tint} />
            ) : (
              <Ionicons name={rightIcon} size={20} color={isFocused ? themeColors.tint : '#888'} />
            )}
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
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    opacity: 0.9,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12, // Default
    paddingHorizontal: 16,
    minHeight: 56,
    // Add shadow for better visibility on light mode/clean look on dark
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    height: '100%',
  },
  iconContainer: {
    marginLeft: 10,
    padding: 4,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 6,
    fontWeight: '500',
  },
});
