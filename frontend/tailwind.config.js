/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wedding: {
          primary: '#f8fafc',
          secondary: '#e2e8f0',
          accent: '#3b82f6',
          dark: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}