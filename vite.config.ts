import { defineConfig } from 'vite'

export default defineConfig({
  base: '/yatagarrage/',
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
})
