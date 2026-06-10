/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#000080'; // Classic vibrant Navy Blue
const tintColorDark = '#F7F5F0'; // Cream for dark mode active

// Gucci Style Palette (Restored)
const gucciGreen = '#115740'; // Classic darker green
const gucciRed = '#B01824';   // Deep rich red
const gucciCream = '#EBE7D9'; // More visible elegant beige/cream for background
const gucciGold = '#D4AF37';  // Luxury Gold
const navyBlue = '#000080';   // Navy Blue for bottom tabs
const darkBackground = '#151718';

export const Colors = {
  light: {
    text: gucciGreen,      // Use Green for text to match style
    background: gucciCream, // Signature Cream background
    tint: navyBlue,        // Navy Blue for active tabs
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: navyBlue, // Navy Blue for active tabs
    primary: gucciGreen,
    secondary: gucciRed,
    tertiary: gucciGold,
    card: '#FFFFFF',
  },
  dark: {
    text: gucciCream,
    background: darkBackground,
    tint: navyBlue,        // Navy Blue for active tabs
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: navyBlue, // Navy Blue for active tabs
    primary: gucciGreen,
    secondary: gucciGold,
    tertiary: gucciCream,
    card: '#232526',
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
