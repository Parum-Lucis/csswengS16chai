import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { qrcode } from 'vite-plugin-qrcode';
import path from 'path';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    qrcode() // only applies in dev mode
  ],
  server: {
    watch: {
      ignored: ["**/emulator-data", "**/functions/**/*.ts, **/firebase-export-*"]
    }
  },
  resolve: {
    alias: {
      '@models': path.resolve(__dirname, '../models'),
    }
  }
})
