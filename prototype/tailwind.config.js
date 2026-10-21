/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#14202b', 2: '#4a5560', 3: '#7b858f' },
        line: { DEFAULT: '#efdde5', 2: '#ddc2cf' },
        paper: { DEFAULT: '#fbf3f7', 2: '#ffffff' },
        rail: { DEFAULT: '#3b0f27', 2: '#561a3b', 3: '#dba9c3' },
        brand: { DEFAULT: '#c72a6b', 50: '#fdecf3', 100: '#f9cfe0', 600: '#a51d55', 700: '#880e40' },
        crit: { DEFAULT: '#c2410c', 50: '#fdeee6', 700: '#9a3412' },
        warn: { DEFAULT: '#b77a00', 50: '#fdf4dd' },
        good: { DEFAULT: '#127a12', 50: '#e8f5e8' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
