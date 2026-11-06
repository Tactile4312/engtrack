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
      boxShadow: {
        card: '0 1px 2px rgba(59, 15, 39, 0.04), 0 1px 1px rgba(59, 15, 39, 0.03)',
        lift: '0 8px 24px -8px rgba(59, 15, 39, 0.18), 0 2px 6px rgba(59, 15, 39, 0.06)',
        pop: '0 24px 64px -16px rgba(20, 32, 43, 0.35), 0 4px 12px rgba(20, 32, 43, 0.08)',
      },
      // One small motion vocabulary for the whole app. styles.css switches all of it off for "reduce motion".
      // Page-level animations only fade: a transform there would move the dialogs placed inside a page.
      keyframes: {
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        pop: { from: { opacity: '0', transform: 'scale(0.96) translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        sheet: { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        drop: { from: { opacity: '0', transform: 'translateY(-16px)' }, to: { opacity: '1', transform: 'none' } },
        toast: { from: { opacity: '0', transform: 'translate(-50%, 16px) scale(0.96)' }, to: { opacity: '1', transform: 'translate(-50%, 0)' } },
        grow: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        tick: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.25)' }, '100%': { transform: 'scale(1)' } },
        shimmer: { from: { backgroundPosition: '-400px 0' }, to: { backgroundPosition: '400px 0' } },
      },
      animation: {
        fade: 'fade 180ms ease-out backwards',
        rise: 'rise 260ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        pop: 'pop 200ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        sheet: 'sheet 280ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        drop: 'drop 280ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        toast: 'toast 240ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        grow: 'grow 700ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        tick: 'tick 260ms ease-out',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
