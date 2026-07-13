import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base 匹配 Gitee Pages 部署路径:https://feng-lingding.gitee.io/wechat-solo/
export default defineConfig({
  base: '/wechat-solo/',
  plugins: [react()],
})
