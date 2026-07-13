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
          // 以下颜色走 CSS 变量，支持深色模式（见 index.css）
          bg: 'var(--wechat-bg)',
          card: 'var(--wechat-card)',
          'text-primary': 'var(--wechat-text-primary)',
          'text-secondary': 'var(--wechat-text-secondary)',
          divider: 'var(--wechat-divider)',
        }
      },
      maxWidth: {
        'phone': '430px',
      }
    },
  },
  plugins: [],
}
