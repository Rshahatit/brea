/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brea: {
          bg: '#0D0D0D',
          surface: '#1A1A1A',
          card: '#242424',
          border: '#333333',
          text: '#FFFFFF',
          'text-secondary': '#A0A0A0',
          accent: '#8B5CF6',
          'accent-light': '#A78BFA',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
