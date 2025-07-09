import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Serv00 部署优化配置
  base: './', // 使用相对路径，适配各种部署环境

  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库打包到单独的 chunk
          vendor: ['react', 'react-dom'],
          // 将图标库打包到单独的 chunk
          icons: ['lucide-react'],
          // 将工具库打包到单独的 chunk
          utils: ['date-fns']
        },

        // 文件命名优化
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash].[ext]';
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash].[ext]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },

    // 压缩优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true // 生产环境移除 debugger
      }
    },

    // 资源内联阈值
    assetsInlineLimit: 4096, // 小于 4kb 的资源内联为 base64

    // 启用 CSS 代码分割
    cssCodeSplit: true,

    // 生成 source map（可选，用于调试）
    sourcemap: false, // 生产环境关闭 source map 以减小文件大小

    // 构建目标
    target: 'es2015', // 兼容更多浏览器

    // 警告阈值
    chunkSizeWarningLimit: 1000 // 1MB
  },

  // 开发服务器配置
  server: {
    port: 5173,
    host: true, // 允许外部访问
    open: true, // 自动打开浏览器

    // 代理配置（如果需要）
    proxy: {
      // 示例：代理 API 请求
      // '/api': {
      //   target: 'http://localhost:3000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // }
    }
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    host: true,
    open: true
  },

  // 环境变量配置
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})
