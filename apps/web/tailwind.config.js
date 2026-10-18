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
        background: '#ffffff',
        surface: '#ffffff',
        'surface-subtle': '#f4f4f5',
        'surface-hover': '#e4e4e7',
        border: '#e4e4e7',
        'border-strong': '#d4d4d8',
        foreground: '#000000',
        'foreground-muted': '#52525b',
        'foreground-subtle': '#71717a',
        primary: {
          DEFAULT: '#000000',
          foreground: '#ffffff',
          hover: '#18181b',
        },
        status: {
          success: '#000000',
          'success-bg': '#f4f4f5',
          'success-border': '#e4e4e7',
          warning: '#52525b',
          'warning-bg': '#f4f4f5',
          'warning-border': '#d4d4d8',
          error: '#000000',
          'error-bg': '#e4e4e7',
          'error-border': '#a1a1aa',
          info: '#71717a',
          'info-bg': '#f4f4f5',
          'info-border': '#d4d4d8',
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
