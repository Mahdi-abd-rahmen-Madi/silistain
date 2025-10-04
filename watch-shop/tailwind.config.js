/** @type {import('tailwindcss').Config} */
export default {
  // Content paths for purging
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html"
  ],
  // Enable class-based dark mode
  darkMode: 'class',
  // Safelist dynamic classes
  safelist: [
    'dark',
    // Grid columns that might be used dynamically
    'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4',
    'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4',
    'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4'
  ],
  // Disable the purge warning
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true,
  },
  experimental: {
    optimizeUniversalDefaults: true
  },
  // Optimize for production
  corePlugins: {
    preflight: true,
    // Disable unused utilities
    float: false,
    clear: false,
    skew: false,
  },
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
        },
        // Accent colors (teal)
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-dark) / <alpha-value>)',
        },
        // Text colors
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          onAccent: 'rgb(var(--color-text-on-accent) / <alpha-value>)',
        },
        // Background colors
        bg: {
          primary: 'rgb(var(--color-bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-bg-secondary) / <alpha-value>)',
          surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
        },
        // Border color
        border: 'rgb(var(--color-border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
  // Disable dark mode
  darkMode: false,
  corePlugins: {
    preflight: true,
  },
}
