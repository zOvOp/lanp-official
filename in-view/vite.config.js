import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 4173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: mode === 'portable' ? {
    assetsInlineLimit: 256_000,
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  } : mode === 'pages' ? {
    outDir: '../dist',
    emptyOutDir: false,
  } : undefined,
}))
