/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        sand: {
          50: '#fdfbf7',
          100: '#faf6ef',
          200: '#f5ecd9',
          300: '#ede0c2',
          400: '#e0cda0',
          500: '#d4b87e',
          600: '#c4a060',
          700: '#a8854e',
          800: '#8a6e42',
          900: '#705a38',
        },
      },
    },
  },
  plugins: [],
}
