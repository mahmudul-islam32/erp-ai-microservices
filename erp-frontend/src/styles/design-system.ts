// SAP-inspired Design System
export const designSystem = {
  colors: {
    // Primary SAP Blue Palette
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3', // Main SAP Blue
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },
    
    // SAP Dark Blue (Sidebar)
    sidebar: {
      background: '#1A237E', // Dark blue
      hover: '#283593',
      active: '#3949AB',
      text: '#FFFFFF',
      textSecondary: '#B0BEC5',
    },
    
    // Status Colors
    status: {
      notExecuted: '#8B5CF6', // Purple
      partiallyExecuted: '#3B82F6', // Blue
      fullyExecuted: '#10B981', // Green
      informational: '#8B5CF6',
      low: '#3B82F6',
      medium: '#F59E0B', // Amber
      high: '#EF4444', // Red
    },
    
    // Neutral Colors
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    
    // Background Colors
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      tertiary: '#F1F3F4',
    },
    
    // Text Colors
    text: {
      primary: '#212121',
      secondary: '#757575',
      tertiary: '#9E9E9E',
      inverse: '#FFFFFF',
    },
  },
  
  typography: {
    fontFamily: {
      primary: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
      secondary: '"Roboto", "Helvetica Neue", Arial, sans-serif',
    },
    
    fontSize: {
      xs: '10px',
      sm: '12px',
      base: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

export type DesignSystem = typeof designSystem;
