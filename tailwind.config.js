/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          DEFAULT: '#ea580c', // Supecard accent orange color
        },
        supe: {
          bgDark: '#0b0c10',
          cardDark: '#1a1c23',
          borderDark: '#2d313f',
          textDark: '#abb2bf',
          textDarkLight: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Karla', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
