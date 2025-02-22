/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'background': {
          DEFAULT: 'hsl(0 0% 100%)',
          dark: 'hsl(240 10% 3.9%)',
        },
        'border': {
          DEFAULT: 'hsl(240 5.9% 90%)',
          dark: 'hsl(240 3.7% 15.9%)',
        },
        'primary': {
          DEFAULT: 'hsl(240 5.9% 10%)',
          dark: 'hsl(0 0% 98%)',
        },
        'input': {
          DEFAULT: 'hsl(240 5.9% 90%)',
          dark: 'hsl(240 3.7% 15.9%)',
        },
        'muted-foreground': {
          DEFAULT: 'hsl(240 3.8% 46.1%)',
          dark: 'hsl(240 5% 64.9%)',
        },
        'ring': {
          DEFAULT: 'hsl(240 10% 3.9%)',
          dark: 'hsl(240 4.9% 83.9%)',
        },
        'accent': {
          DEFAULT: 'hsl(240 4.8% 95.9%)',
          dark: 'hsl(240 3.7% 15.9%)',
        },
        'accent-foreground': {
          DEFAULT: 'hsl(240 5.9% 10%)',
          dark: 'hsl(0 0% 98%)',
        },
        'primary-foreground': {
          DEFAULT: 'hsl(0 0% 98%)',
          dark: 'hsl(240 5.9% 10%)',
        }
      },
    },
  },
  plugins: [],
};
