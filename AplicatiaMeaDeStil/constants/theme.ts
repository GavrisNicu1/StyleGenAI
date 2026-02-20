/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#000080'; // Classic vibrant Navy Blue
const tintColorDark = '#F7F5F0'; // Cream for dark mode active

// Gucci Style Palette
const gucciGreen = '#115740'; // Classic darker green
const gucciRed = '#B01824';   // Deep rich red
const gucciCream = '#866c2a'; // Elegant off-white/beige background
const gucciGold = '#C5A059';  // Muted luxury gold
const gucciNavy = '#000080';  // Classic vibrant Navy Blue

export const Colors = {
  light: {
    text: '#000080',       // Navy Blue text
    background: gucciCream, // Signature Cream background
    tint: tintColorLight,
    icon: '#4B5E85',       // Lighter Blue-Grey for inactive tabs (instead of plain grey)
    tabIconDefault: '#4B5E85',
    tabIconSelected: tintColorLight,
    primary: gucciGreen,
    secondary: gucciRed,
    tertiary: gucciGold, // Changed to Gold for borders/accents
    card: '#FFFFFF',       // Clean white for cards to pop against cream
  },
  dark: {
    text: '#F7F5F0',       // Cream text
    background: '#f5f2af', // Very dark green/black background for dark mode
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: gucciGreen,
    secondary: gucciRed,
    tertiary: gucciNavy, // Changed to Navy Blue per user request
    card: '#99b619',       // Dark green card background
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
