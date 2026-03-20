/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./src/**/*.{html,js}",
    "./case-data.js"
  ],
  safelist: [
    'animate-fadeIn',
    'animate-fadeOut',
    'hidden',
    'selected',
    { pattern: /bg-(amber|emerald|violet|sky|rose|blue|indigo)-(50|100)/ },
    { pattern: /text-(amber|emerald|violet|sky|rose|blue|indigo)-600/ }
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
