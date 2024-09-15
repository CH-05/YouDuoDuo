import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'development' ? process.env.NODE_ENV : 'development',
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build:{
    outDir:'dmy_dist', //  打包构建输出路径，默认 dmy_dist ，如果路径存在，构建之前会被删除
    rollupOptions: {
      output: {
        /** S-静态文件按类型分包 */
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        /** E-静态文件按类型分包 */
        manualChunks(id) {  // 超大静态资源拆分
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    },
    terserOptions: {
      //打包后移除console和注释
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    }
  },
  server: {
    host: '127.0.0.1',
    port: 8053,
    open: true,
    cors: true,
    strictPort: true, //严格的端口号，如果true，端口号被占用时会直接退出
    hmr: true,//开启热更新
    proxy: {
      '/api':{
        target: 'http://localhost:8054',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
})
