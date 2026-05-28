import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        ink: 'var(--color-ink)',
        accent: 'var(--color-accent)',
        'accent-soft': 'var(--color-accent-soft)',
        muted: 'var(--color-muted)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'DM Sans', 'sans-serif'],
      },
      borderRadius: {
        brand: 'var(--radius)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
      },
    },
  },
  plugins: [],
};

export default config;
