/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E07B39',      // 暖橙色
          50: '#FEF6F0',          // 淡橙白
          100: '#FDEDD8',         // 浅橙米
          200: '#FCDAB5',         // 橙米色
          300: '#FAC78E',         // 浅橙
          400: '#F8A86A',        // 亮橙
          500: '#E07B39',         // 主色
          600: '#C4622A',         // 深橙
          700: '#9E4C21',         // 棕色橙
          800: '#783919',         // 深棕橙
          900: '#4D260F',         // 暗棕
        },
        warm: {                   // 新增暖色调
          50: '#FFFBF7',          // 暖白
          100: '#FFF5EB',         // 淡橙白
          200: '#FFECD4',         // 浅暖米
          300: '#FFE0BC',         // 暖米
          400: '#FFD4A3',        // 浅橙米
          500: '#FFC08A',         // 橙米
        },
        background: '#FBF7F2',    // 暖白背景
        surface: '#FFFFFF',        // 卡片白
        accent: '#D4845C',         // 强调色（暖棕橙）
        danger: '#C75D4A',        // 暖红色
      },
      borderRadius: {
        'card': '16px',
        'button': '10px',
      },
      boxShadow: {
        'warm': '0 2px 12px rgba(224, 123, 57, 0.15)',    // 暖色阴影
        'warm-lg': '0 4px 20px rgba(224, 123, 57, 0.2)',
        'warm-top': '0 -2px 12px rgba(224, 123, 57, 0.1)',
      },
    },
  },
  plugins: [],
}
