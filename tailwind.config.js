/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        green: '#608F46',
        cream: '#FDF9EE',
        base: {
          light: '#FDF9EE',
          dark: '#1E1E1E',
        },
        text: {
          primary: '#1E1E1E',
          secondary: '#777777',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        modern: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 2px 8px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
