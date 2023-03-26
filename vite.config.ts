import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite';
import { comlink } from 'vite-plugin-comlink';
import eslint from 'vite-plugin-eslint';
import { VitePluginRadar } from 'vite-plugin-radar';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    eslint(),
    comlink(),
    VitePluginRadar({
      // Google Analytics tag injection
      enableDev: true,
      analytics: {
        id: 'G-RZ5NKLB1W2',
      },
    }),
  ],
  worker: {
    plugins: [comlink(), tsconfigPaths(), eslint()],
  },
});
