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
        'tgate': {
          'primary': '#0088cc',
          'primary-dark': '#005577',
          'primary-light': '#0099dd',
          'secondary': '#ffffff',
          'dark': '#1a1a1a',
          'panel': '#2d2d2d',
          'border': '#404040',
          'border-light': '#555',
          'text': '#e0e0e0',
          'text-muted': '#b0b0b0',
          'text-dark': '#888888',
        },
        'gray': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#2d2d2d',
          900: '#1a1a1a',
          950: '#0f0f0f',
        }
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'reading': ['Georgia', 'Times New Roman', 'serif', 'system-ui'],
      },
      boxShadow: {
        'tgate': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'tgate-button': '0 6px 20px rgba(0, 136, 204, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
        'tgate-button-hover': '0 8px 25px rgba(0, 136, 204, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'tgate-gradient': 'linear-gradient(135deg, #0088cc 0%, #005577 50%, #0088cc 100%)',
        'tgate-gradient-hover': 'linear-gradient(135deg, #0099dd 0%, #006688 50%, #0099dd 100%)',
        'tgate-accent': 'linear-gradient(to right, #0088cc, #ffffff)',
      }
    },
  },
  plugins: [],
}