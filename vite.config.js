import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        tps: resolve(process.cwd(), 'tps/index.html'),
      },
    },
  },
})
