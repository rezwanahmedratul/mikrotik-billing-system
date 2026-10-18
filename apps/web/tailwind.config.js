/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#fafafa',
        surface: '#ffffff',
        'surface-subtle': '#f4f4f5',
        'surface-hover': '#ececee',
        border: '#e4e4e7',
        'border-strong': '#d4d4d8',
        foreground: '#09090b',
        'foreground-muted': '#71717a',
        'foreground-subtle': '#a1a1aa',
        primary: {
          DEFAULT: '#18181b',
          foreground: '#fafafa',
          hover: '#27272a',
        },
        status: {
          success: '#16a34a',
          'success-bg': '#f0fdf4',
          'success-border': '#bbf7d0',
          warning: '#ca8a04',
          'warning-bg': '#fefce8',
          'warning-border': '#fef08a',
          error: '#dc2626',
          'error-bg': '#fef2f2',
          'error-border': '#fecaca',
          info: '#2563eb',
          'info-bg': '#eff6ff',
          'info-border': '#bfdbfe',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
