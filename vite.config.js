import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/internship-tracker/', 
=======

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
>>>>>>> origin/main
})
