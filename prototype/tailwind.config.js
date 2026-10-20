/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#14202b', 2: '#4a5560', 3: '#7b858f' },
        line: { DEFAULT: '#dde2e7', 2: '#c5ccd3' },
        paper: { DEFAULT: '#f4f6f8', 2: '#ffffff' },
        rail: { DEFAULT: '#152230', 2: '#1e3042', 3: '#8fa3b6' },
        brand: { DEFAULT: '#2a78d6', 50: '#ecf3fc', 100: '#cde2fb', 600: '#1c5cab', 700: '#184f95' },
        crit: { DEFAULT: '#c63434', 50: '#fcecec', 700: '#9f2424' },
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
