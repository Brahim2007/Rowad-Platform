import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '2.5rem',
        xl: '3rem',
      },
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        primary: {
          50:  'hsl(var(--primary-50) / <alpha-value>)',
          100: 'hsl(var(--primary-100) / <alpha-value>)',
          200: 'hsl(var(--primary-200) / <alpha-value>)',
          300: 'hsl(var(--primary-300) / <alpha-value>)',
          400: 'hsl(var(--primary-400) / <alpha-value>)',
          500: 'hsl(var(--primary-500) / <alpha-value>)',
          600: 'hsl(var(--primary-600) / <alpha-value>)',
          700: 'hsl(var(--primary-700) / <alpha-value>)',
          800: 'hsl(var(--primary-800) / <alpha-value>)',
          900: 'hsl(var(--primary-900) / <alpha-value>)',
          950: 'hsl(var(--primary-950) / <alpha-value>)',
        },
        secondary: {
          50:  'hsl(var(--secondary-50) / <alpha-value>)',
          100: 'hsl(var(--secondary-100) / <alpha-value>)',
          200: 'hsl(var(--secondary-200) / <alpha-value>)',
          300: 'hsl(var(--secondary-300) / <alpha-value>)',
          400: 'hsl(var(--secondary-400) / <alpha-value>)',
          500: 'hsl(var(--secondary-500) / <alpha-value>)',
          600: 'hsl(var(--secondary-600) / <alpha-value>)',
          700: 'hsl(var(--secondary-700) / <alpha-value>)',
          800: 'hsl(var(--secondary-800) / <alpha-value>)',
          900: 'hsl(var(--secondary-900) / <alpha-value>)',
        },
        neutral: {
          50:  '#FAFAF9',
          100: '#F5F4F1',
          200: '#E8E6E0',
          300: '#D4D1C8',
          400: '#A8A496',
          500: '#7C7868',
          600: '#5C5849',
          700: '#45423A',
          800: '#2D2B26',
          900: '#1A1916',
          950: '#0F0E0C',
        },
        success: {
          50: '#F0FDF4',
          500: '#22C55E',
          700: '#15803D',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          700: '#B45309',
        },
        error: {
          50: '#FEF2F2',
          500: '#EF4444',
          700: '#B91C1C',
        },
        info: {
          50: '#EFF6FF',
          500: '#3B82F6',
          700: '#1D4ED8',
        },
      },
      fontFamily: {
        arabic: ['var(--font-ibm-plex-arabic)', 'system-ui', 'sans-serif'],
        english: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '0' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', letterSpacing: '0' }],
        'display-lg':  ['3rem', { lineHeight: '1.15', letterSpacing: '0' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-primary': '0 0 30px -5px hsl(var(--primary-500) / 0.4)',
        'glow-secondary': '0 0 30px -5px hsl(var(--secondary-500) / 0.4)',
        'card-hover': '0 12px 24px -8px rgb(0 0 0 / 0.12)',
        'soft': '0 2px 8px -2px rgb(0 0 0 / 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 400ms ease-out',
        'fade-in-up': 'fadeInUp 500ms ease-out',
        'fade-in-down': 'fadeInDown 500ms ease-out',
        'slide-in-from-end': 'slideInFromEnd 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromEnd: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '220' },
          '100%': { strokeDashoffset: '0' },
        },
        floatNode: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scrollBand: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, hsl(var(--primary-500)) 0%, hsl(var(--primary-700)) 100%)',
        'gradient-secondary': 'linear-gradient(135deg, hsl(var(--secondary-500)) 0%, hsl(var(--secondary-700)) 100%)',
        'gradient-soft': 'linear-gradient(135deg, hsl(var(--primary-50)) 0%, hsl(var(--secondary-50)) 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('tailwindcss-rtl'),
  ],
}

export default config
