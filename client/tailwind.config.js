/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        courier: ['Courier New', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
};
