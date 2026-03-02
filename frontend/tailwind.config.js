/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0c121d',
        panel: '#101a29',
        accent: '#34d399',
        muted: '#8ca3b8',
      },
    },
  },
  plugins: [],
};
