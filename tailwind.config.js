/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f1115',
        card: '#1a1d24',
        border: '#2a2f3a',
        accent: '#f5a623',
      },
    },
  },
  plugins: [],
}
