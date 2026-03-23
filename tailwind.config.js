/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        siege: {
          bg: '#0d0d0d',
          surface: '#161616',
          card: '#1c1c1c',
          border: '#2a2a2a',
          accent: '#e8a020',
          gold: '#f0c040',
          red: '#e03030',
          green: '#30a050',
          blue: '#3080e0',
          muted: '#6b7280',
        },
      },
    },
  },
  plugins: [],
}
