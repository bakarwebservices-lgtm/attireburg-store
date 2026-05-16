/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neutral gray scale — backgrounds, text, borders, UI chrome
        primary: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Brand burgundy — announcement bar, footer, primary CTAs, active accents
        brand: {
          50:  '#fdf2f4',
          100: '#fae0e4',
          200: '#f0b8c2',
          300: '#e07a8e',
          400: '#c94d65',
          500: '#a82038',
          600: '#8a1a2e',
          700: '#6b1424',
          800: '#47131e',  // logo core
          900: '#2e0c13',
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}