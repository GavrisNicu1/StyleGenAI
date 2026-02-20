import { View, type ViewProps, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'gradient'; // Added variant for pearlescent background
};

export function ThemedView({ style, lightColor, darkColor, variant = 'default', ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  // If variant is 'gradient', we just return the View with the background color for now 
  // to ensure the user's request for "Beautiful Cream" is respected everywhere.
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
