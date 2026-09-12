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
        // ── Stitch "Radiant Crimson Glass" Design System ──────────────────────
        // PRIMARY spectrum — strictly zero green
        'primary': '#b80035',
        'on-primary': '#ffffff',
        'primary-container': '#e11d48',
        'on-primary-container': '#fffaf9',
        'primary-fixed': '#ffdada',
        'primary-fixed-dim': '#ffb3b6',
        'on-primary-fixed': '#40000c',
        'on-primary-fixed-variant': '#920028',
        'inverse-primary': '#ffb3b6',

        // SECONDARY spectrum
        'secondary': '#b80938',
        'on-secondary': '#ffffff',
        'secondary-container': '#db2e4e',
        'on-secondary-container': '#fffbff',
        'secondary-fixed': '#ffdadb',
        'secondary-fixed-dim': '#ffb2b7',
        'on-secondary-fixed': '#40000d',
        'on-secondary-fixed-variant': '#920029',

        // TERTIARY spectrum
        'tertiary': '#ac2926',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#ce423c',
        'on-tertiary-container': '#fffaf9',
        'tertiary-fixed': '#ffdad6',
        'tertiary-fixed-dim': '#ffb4ac',
        'on-tertiary-fixed': '#410002',
        'on-tertiary-fixed-variant': '#8e1214',

        // SURFACE spectrum — cool slate blues (these provide glass refraction material)
        'surface': '#f8f9ff',
        'surface-dim': '#ccdbf4',
        'surface-bright': '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e6eeff',
        'surface-container-high': '#dde9ff',
        'surface-container-highest': '#d5e3fd',
        'surface-variant': '#d5e3fd',
        'surface-tint': '#be0037',

        // ON-SURFACE text colors
        'on-surface': '#0d1c2f',
        'on-surface-variant': '#5c3f40',
        'inverse-surface': '#233144',
        'inverse-on-surface': '#ebf1ff',

        // OUTLINE
        'outline': '#906f70',
        'outline-variant': '#e5bdbe',

        // BACKGROUND
        'background': '#f8f9ff',
        'on-background': '#0d1c2f',

        // ERROR
        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
      },
      borderRadius: {
        'DEFAULT': '0.5rem',   // 8px  (rounded)
        'sm': '0.25rem',       // 4px
        'md': '0.75rem',       // 12px
        'lg': '1rem',          // 16px
        'xl': '1.5rem',        // 24px
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
        'glass-sm': '0 4px 16px rgba(225, 29, 72, 0.06)',
        'glass': '0 12px 32px rgba(225, 29, 72, 0.08)',
        'glass-md': '0 16px 40px rgba(225, 29, 72, 0.14)',
        'glass-lg': '0 24px 64px rgba(153, 27, 27, 0.20)',
        'crimson': '0 4px 14px rgba(225, 29, 72, 0.35)',
        'crimson-sm': '0 2px 8px rgba(225, 29, 72, 0.25)',
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
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
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
