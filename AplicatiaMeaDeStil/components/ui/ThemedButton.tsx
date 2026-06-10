import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, StyleProp, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
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

type ReadonlyThemedButtonProps = Readonly<ThemedButtonProps>;

export function ThemedButton({
  title,
  onPress,
  type = 'primary',
  style,
  textStyle,
  icon,
  loading = false,
  disabled = false,
}: ReadonlyThemedButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[theme];

  const getColors = () => {
    const primaryColors = {
      background: [themeColors.primary, '#004D40'] as const,
      text: '#FFFFFF',
      icon: '#FFFFFF',
      border: 'transparent'
    };

    switch (type) {
      case 'primary':
        return primaryColors;
      case 'secondary':
        return {
          background: [themeColors.secondary, '#C5A059'] as const, 
          text: '#000000', 
          icon: '#000000',
          border: 'transparent'
        };
      case 'tertiary':
        return {
          background: [themeColors.tertiary, '#000000'] as const,
          text: '#FFFFFF',
          icon: '#FFFFFF',
          border: 'transparent'
        };
      case 'outline':
        return {
          background: ['transparent', 'transparent'] as const,
          // Use tint (Gold) for outline on dark mode for high visibility
          text: themeColors.tint, 
          icon: themeColors.tint,
          border: themeColors.tint
        };
      case 'ghost':
        return {
          background: ['transparent', 'transparent'] as const,
          text: themeColors.text, 
          icon: themeColors.text,
          border: 'transparent'
        };
      default:
        return primaryColors;
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
        disabled={loading || disabled}
        style={[
          styles.button,
          { 
            backgroundColor: 'transparent',
            borderColor: colors.border,
            borderWidth: type === 'outline' ? 1.5 : 0,
          },
          disabled && styles.disabled,
          style,
        ]}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.button,
        styles.gradientButtonWrapper, 
        disabled && styles.disabled, 
        style
      ]}
    >
      <LinearGradient
        colors={colors.background as readonly [string, string]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {renderContent()}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 30, // Pill shape
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientButtonWrapper: {
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});
