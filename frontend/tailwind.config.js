/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#ede4d4',
          300: '#e0d1b9',
          400: '#cdb797',
          500: '#b89c74',
          600: '#9e805b',
          700: '#7f6547',
          800: '#644f38',
          900: '#4e3e2d',
          950: '#2c2217',
        },
        sand: {
          50: '#fdfbf7',
          100: '#f9f5ed',
          200: '#f2e9dc',
          300: '#e7d8c4',
          400: '#d5bfa6',
          500: '#c0a386',
        },
        paypal: {
          blue: '#003087',
          lightBlue: '#0079C1',
          gold: '#FFC439'
        }
      }
    },
  },
  plugins: [],
}
