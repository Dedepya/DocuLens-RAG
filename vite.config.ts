import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/DocuLens-RAG/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
