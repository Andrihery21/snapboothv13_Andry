/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' }
        }
      },
      animation: {
        'progress-indeterminate': 'progress-indeterminate 1.5s infinite ease-in-out'
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-dark': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)'
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "Roboto", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed', // Violet principal
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        secondary: colors.blue,
        success: colors.emerald,
        error: colors.red,
        warning: colors.amber,
        info: colors.blue,
        background: {
          DEFAULT: '#F9FAFB', // Fond principal (clair)
          dark: '#18181B',    // Fond principal (sombre)
        },
        surface: {
          DEFAULT: '#FFFFFF', // Fond secondaire (clair)
          dark: '#27272A',    // Fond secondaire (sombre)
        },
        surface_alt: {
          DEFAULT: '#F3F4F6', // Fond tertiaire (clair)
          dark: '#3F3F46',    // Fond tertiaire (sombre)
        },
        border: {
          DEFAULT: '#E5E7EB', // Bordure principale (clair)
          dark: '#52525B',    // Bordure principale (sombre)
          secondary: '#D1D5DB', // Bordure secondaire (clair)
          secondary_dark: '#71717A', // Bordure secondaire (sombre)
        },
        text: {
          DEFAULT: '#18181B',  // Texte principal (clair)
          dark: '#F9FAFB',     // Texte principal (sombre)
          secondary: '#4B5563', // Texte secondaire (clair)
          secondary_dark: '#D4D4D8', // Texte secondaire (sombre)
          disabled: '#9CA3AF', // Texte désactivé (clair)
          disabled_dark: '#71717A', // Texte désactivé (sombre)
        },
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'card-dark': '0 2px 8px 0 rgba(0, 0, 0, 0.25)',
        'dropdown': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'dropdown-dark': '0 4px 16px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [],
}
