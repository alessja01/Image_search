import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

console.log('Vite Configuration Loaded')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      process: 'process/browser', //vite così usa la versione browser-friendly
    },
  },
  define:{
    'process.env':{}, 
  },
  server: {
    cors: {
      origin: '*', // Consente richieste da qualsiasi origine
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
