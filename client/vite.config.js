import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // ✅ Add this line

export default defineConfig({
  plugins: [react(), tailwindcss()], // ✅ Add tailwindcss() here
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})