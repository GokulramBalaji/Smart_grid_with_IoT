/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#F5F5F7',
          card: '#FFFFFF',
          subtle: '#FBFBFD',
          border: 'rgba(0, 0, 0, 0.08)',
          text: '#1D1D1F',
          secondary: '#86868B',
          blue: '#0071E3',
          hoverBlue: '#0077ED',
        },
        phaseR: {
          DEFAULT: '#FF3B30', // Apple System Red
          light: '#FFEBEA',
          dark: '#D70015',
        },
        phaseY: {
          DEFAULT: '#FF9500', // Apple System Orange / Amber
          light: '#FFF4E5',
          dark: '#C93400',
        },
        phaseB: {
          DEFAULT: '#007AFF', // Apple System Blue
          light: '#E5F1FF',
          dark: '#0040DD',
        },
        system: {
          green: '#34C759',
          purple: '#AF52DE',
          teal: '#30B0C7',
          indigo: '#5856D6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'apple-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'apple-card': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'apple-hover': '0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
        'apple-float': '0 20px 40px -6px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
