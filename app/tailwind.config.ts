import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 紙感底色
        cream: '#f4efe6', // 頁面背景
        paper: '#faf7f0', // 卡片
        line: '#e3dccd', // 分隔線 / 柔邊框
        // 墨色文字
        ink: '#2b2723', // 主文字
        'ink-soft': '#8a8178', // 次要文字
        'ink-faint': '#b3a99a', // 更淡的提示
        // 大地色重點
        terracotta: '#bf6a4e', // 主色
        'terracotta-soft': '#d99c84',
        olive: '#7a8450', // 輔色(正向變化)
        mustard: '#caa24a', // 第三色(放縱日 / 內臟脂肪)
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif TC"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
