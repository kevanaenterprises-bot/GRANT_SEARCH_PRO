/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1d4ed8', foreground: '#ffffff' },
        secondary: { DEFAULT: '#f1f5f9', foreground: '#0f172a' },
        destructive: { DEFAULT: '#ef4444', foreground: '#ffffff' },
        muted: { DEFAULT: '#f8fafc', foreground: '#64748b' },
        accent: { DEFAULT: '#f0f9ff', foreground: '#0369a1' },
        border: '#e2e8f0',
        ring: '#1d4ed8',
        background: '#ffffff',
        foreground: '#0f172a',
        card: { DEFAULT: '#ffffff', foreground: '#0f172a' },
        hot: '#ef4444',
        warm: '#f59e0b',
        cold: '#94a3b8',
      },
    },
  },
  plugins: [],
};
