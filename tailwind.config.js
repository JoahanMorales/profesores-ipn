/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        'ipn-guinda': {
          50: '#fdf4f7',
          100: '#fce8f0',
          200: '#fad1e3',
          300: '#f7a9cb',
          400: '#f176a9',
          500: '#e74c89',
          600: '#d42c69',
          700: '#b81e53',
          800: '#981b46',
          900: '#6C1458', // Guinda oficial IPN
          950: '#4a0938',
        },
      },
    },
  },
  plugins: [],
}
