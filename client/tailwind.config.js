/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Vital Flow Design System ─────────────────────────────────────────
        // PRIMARY: Signature Vital Flow Crimson
        'primary': '#C30121',
        'primary-dark': '#A30018',
        'primary-light': '#D6223F',
        'primary-50': '#FDF3F4',
        'primary-100': '#FCE8EB',
        'primary-200': '#F8D2D7',
        'primary-container': '#FDF2F4',
        'on-primary': '#FFFFFF',
        'on-primary-container': '#4F000D',
        'primary-fixed': '#FFDADA',
        'primary-fixed-dim': '#FFB3B6',
        'on-primary-fixed': '#40000C',

        // SECONDARY: Charcoal Onyx / Dark Slate (#2B2B2B)
        'secondary': '#2B2B2B',
        'secondary-light': '#4D4D4D',
        'secondary-dark': '#1A1A1A',
        'secondary-container': '#F3EEEE',
        'on-secondary': '#FFFFFF',
        'on-secondary-container': '#2B2B2B',
        'secondary-fixed': '#EBE8EB',
        'secondary-fixed-dim': '#D6D1D6',

        // TERTIARY: Medical Azure / Deep Cobalt Blue (#0D68AA)
        'tertiary': '#0D68AA',
        'tertiary-dark': '#094F82',
        'tertiary-light': '#2587CF',
        'tertiary-50': '#F0F7FC',
        'tertiary-100': '#DCECF7',
        'tertiary-container': '#E7F2FA',
        'on-tertiary': '#FFFFFF',
        'on-tertiary-container': '#053152',

        // NEUTRAL: Warm Slate / Muted Taupe (#8E7D7F)
        'neutral': '#8E7D7F',
        'neutral-dark': '#5E5153',
        'neutral-light': '#B8AAAB',
        'neutral-50': '#FAF7F7',
        'neutral-100': '#F5F0F1',
        'neutral-variant': '#ECE4E5',
        'neutral-soft': '#F7F3F4',

        // SURFACE SPECTRUM — Soothing Warm Porcelain Blush (#FAF4F4)
        'surface': '#FAF4F4',
        'surface-dim': '#EFE7E8',
        'surface-bright': '#FFFFFF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#FAF4F4',
        'surface-container': '#F5ECEE',
        'surface-container-high': '#EFE6E8',
        'surface-container-highest': '#E4D9DC',
        'surface-variant': '#ECE4E5',
        'surface-tint': '#C30121',

        // TEXT & CONTENT
        'on-surface': '#2B2B2B',
        'on-surface-variant': '#8E7D7F',
        'inverse-surface': '#2B2B2B',
        'inverse-on-surface': '#FAF4F4',

        // BORDERS & OUTLINES
        'outline': '#8E7D7F',
        'outline-variant': '#E8DFE1',
        'outline-soft': '#EFE7E9',

        // BACKGROUND
        'background': '#FAF4F4',
        'on-background': '#2B2B2B',

        // ERROR
        'error': '#C30121',
        'on-error': '#FFFFFF',
        'error-container': '#FDF2F4',
        'on-error-container': '#A30018',
      },
      borderRadius: {
        'DEFAULT': '0.5rem',   // 8px
        'sm': '0.25rem',       // 4px
        'md': '0.75rem',       // 12px
        'lg': '1rem',          // 16px
        'xl': '1.25rem',       // 20px
        '2xl': '1.5rem',       // 24px
        '3xl': '2rem',         // 32px
        'full': '9999px',
      },
      spacing: {
        'space-xs': '0.375rem',  // 6px
        'space-sm': '0.75rem',   // 12px
        'space-md': '1.25rem',   // 20px
        'space-lg': '2rem',      // 32px
        'space-xl': '3rem',      // 48px
        'gutter': '1.5rem',      // 24px
        'margin': '2.5rem',      // 40px
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        headline: ['Georgia', 'serif'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '56px', fontWeight: '800' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'label-md': ['12px', { lineHeight: '16px', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '700' }],
      },
      boxShadow: {
        'glass-sm': '0 4px 16px rgba(195, 1, 33, 0.05)',
        'glass': '0 12px 32px rgba(195, 1, 33, 0.08)',
        'glass-md': '0 16px 40px rgba(195, 1, 33, 0.12)',
        'glass-lg': '0 24px 64px rgba(43, 40, 43, 0.10)',
        'crimson': '0 4px 14px rgba(195, 1, 33, 0.28)',
        'crimson-sm': '0 2px 8px rgba(195, 1, 33, 0.20)',
        'vital': '0 10px 30px -5px rgba(195, 1, 33, 0.25)',
        'vital-soft': '0 8px 24px rgba(43, 40, 43, 0.06)',
      },
      backdropBlur: {
        'glass-sm': '12px',
        'glass': '18px',
        'glass-md': '24px',
        'glass-lg': '32px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
