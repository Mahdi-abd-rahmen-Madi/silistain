/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html"
  ],
  // Future configurations
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true,
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
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				light: 'rgb(var(--color-primary-light) / <alpha-value>)',
  				dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				light: 'rgb(var(--color-accent-light) / <alpha-value>)',
  				dark: 'rgb(var(--color-accent-dark) / <alpha-value>)',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			text: {
  				primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
  				secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
  				muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
  				onAccent: 'rgb(var(--color-text-on-accent) / <alpha-value>)'
  			},
  			bg: {
  				primary: 'rgb(var(--color-bg-primary) / <alpha-value>)',
  				secondary: 'rgb(var(--color-bg-secondary) / <alpha-value>)',
  				surface: 'rgb(var(--color-bg-surface) / <alpha-value>)'
  			},
  			border: 'hsl(var(--border))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'sans-serif'
  			],
  			serif: [
  				'Playfair Display',
  				'serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
  corePlugins: {
    preflight: true,
  },
}
