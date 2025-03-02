import { defineConfig } from 'vite'
import * as path from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
  },
  root: './',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  resolve: {
    alias: {
      '@snackTrack': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, './src'),
    },
    extensions: [
        '.json',
        '.ts',
        '.tsx',
    ],
  },
})
