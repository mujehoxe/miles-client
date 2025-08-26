/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * These colors are based on the Miles brand palette from the CRM system.
 */

// Miles brand colors from Tailwind config
const MilesBrandColors = {
  50: '#e6f0f8',
  100: '#cce0f2',
  200: '#99c1e5',
  300: '#66a3d9',
  400: '#3385cc',
  500: '#176298', // Base Miles brand color
  600: '#155780',
  700: '#124b68',
  800: '#0f3f50',
  900: '#0d333f',
};

const tintColorLight = MilesBrandColors[500]; // Miles brand blue
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: MilesBrandColors[600],
    tabIconDefault: MilesBrandColors[400],
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  // Export Miles brand colors for direct use
  miles: MilesBrandColors,
};
