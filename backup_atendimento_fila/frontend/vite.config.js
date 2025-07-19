
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Redireciona todas as solicitações para o index.html (essencial para SPAs)
    historyApiFallback: true,
  },
  // Adicionado para garantir que o Vite trate o app como SPA
  appType: 'spa',
});

