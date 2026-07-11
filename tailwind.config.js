/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wechat: {
          green: '#07C160',
          'green-dark': '#06ad56',
          bg: '#EDEDED',
          'text-primary': '#000000',
          'text-secondary': '#888888',
          divider: '#E5E5E5',
        }
      },
      maxWidth: {
        'phone': '430px',
      }
    },
  },
  plugins: [],
}
