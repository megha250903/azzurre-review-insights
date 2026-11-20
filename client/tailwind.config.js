/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif', 'system-ui']
      },
      colors: {
        azzurro: {
          cream:  '#FAF8F4',
          sand:   '#F4EFE6',
          card:   '#FFFFFF',
          border: '#E8E4DC',
          dark:   '#0F172A',
          blue:   '#0284C7',
          sky:    '#0EA5E9',
          navy:   '#0C4A6E'
        }
      }
    }
  },
  plugins: []
};
