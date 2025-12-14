/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: 'var(--color-primary)',
          600: 'var(--color-primary-dark)',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          500: 'var(--color-secondary)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          500: 'var(--color-accent)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: 'var(--color-success)',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: 'var(--color-warning)',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: 'var(--color-danger)',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        background: {
          DEFAULT: 'var(--color-background)',
          dark: 'var(--color-background-dark)',
          body: '#F1F1FA',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          dark: 'var(--color-text-dark)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        base: 'var(--font-size-base)',
        sm: 'var(--font-size-small)',
        lg: 'var(--font-size-large)',
      },
      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        bold: 'var(--font-weight-bold)',
      },
      borderRadius: {
        DEFAULT: 'var(--border-radius)',
        lg: 'var(--border-radius-large)',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'large': '0 8px 24px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
}

