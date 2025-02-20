// vite提供了loadEnv，可以加载不同环境下面的环境变量
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 获取各种环境下对应的变量 (有哪些变量，可以去环境变量的文件里面查看)
  // loadEnv(当前所处的开发环境, 环境文件的父级路径)
  // process.cwd()：就是项目根目录的路径
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [
      vue(),
      // svg图片
      createSvgIconsPlugin({
        // svg图标放在src/assets/icons文件夹下面 (配置完之后，使用svg图片会自动去这个文件目录下面寻找)
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        // Specify symbolId format (svg图片复用symbolId配置)
        // <use xlink:href="#icon-copyright"></use>，配置xlink:href复用的symbolId的名字格式
        symbolId: 'icon-[dir]-[name]',
      }),
    ],
    resolve: {
      // 路径别名
      alias: {
        '@': path.resolve('./src'), // 相对路径别名配置，使用 @ 代替 src
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    // scss全局变量的配置
    css: {
      preprocessorOptions: {
        scss: {
          javascriptEnabled: true,
          additionalData: `@import "./src/styles/variable.scss";`,
        },
      },
    },
    // 优化代理配置
    server: {
      port: 5177,
      host: true,
      cors: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          // 添加调试日志
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('代理请求:', req.method, req.url, '->',
                `${options.target}${proxyReq.path}`);
            });
            proxy.on('error', (err, req, res) => {
              console.error('代理错误:', err);
            });
          }
        },
        [env.VITE_APP_BASE_API]: {
          target: env.VITE_SERVE,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    // 添加构建优化
    build: {
      // 生产环境移除 console
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // 构建后的文件大小警告限制
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
  }
})
