/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F5F1E8',
          100: '#D4C4B0',
          200: '#C4B5A0',
          300: '#B4A590',
          400: '#A0826D',
          500: '#8B6F47',
          600: '#6F5A3A',
          700: '#5C4A35',
          800: '#4A3B2B',
          900: '#3A2E22',
        },
      },
    },
  },
  plugins: [],
}