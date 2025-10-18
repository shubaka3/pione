/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#2F5E32',
        'secondary-green': '#4A7834',
        'accent-green': '#8BC34A',
        'soil-brown': '#5D4037',
        'wood-brown': '#795548',
        'sand-beige': '#D7CCC8',
        'sky-blue': '#03A9F4',
        'water-blue': '#0288D1',
        'cloud-white': '#ECEFF1',
        'success-green': '#4CAF50',
        'warning-yellow': '#FFC107',
        'danger-red': '#F44336',
        'text-dark': '#263238',
        'text-medium': '#455A64',
        'text-light': '#B0BEC5',
        'bg-nature': '#F5F7F4',
        'bg-soft-green': '#E8F5E9',
        'bg-forest': '#1B2519',
      },
      fontFamily: {
        sans: ['Source Sans Pro', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'nature': '0 4px 6px rgba(47, 94, 50, 0.1)',
        'nature-hover': '0 6px 12px rgba(47, 94, 50, 0.15)',
      },
      borderRadius: {
        'nature': '12px',
      },
    },
  },
  plugins: [],
}
