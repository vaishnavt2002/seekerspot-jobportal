// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   define: {
//     global: 'window',
//   },
//   server: {
//     host: '0.0.0.0',
//     port: 5173,
//     allowedHosts: ['192.168.1.10'],
//     proxy: {
//       '/community': {
//         target: 'http://192.168.1.10:8000',
//         changeOrigin: true,
//       },
//       '/ws': {
//         target: 'ws://192.168.1.10:8000',
//         ws: true,
//       },
//     },
//   },
// })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  define: {
    global: 'window', // Polyfill global as window
  },
  server: {
    host: '0.0.0.0', 
    
    allowedHosts: ['6d14-103-175-88-59.ngrok-free.app'],
    proxy: {
      '/community': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
