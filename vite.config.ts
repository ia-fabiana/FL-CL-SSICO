import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const hmrEnabled = process.env.DISABLE_HMR !== 'true';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Keep this behavior, but force local websocket to port 3000 when enabled.
      hmr: hmrEnabled
        ? {
            host: 'localhost',
            protocol: 'ws',
            port: 3000,
            clientPort: 3000,
          }
        : false,
    },
  };
});
