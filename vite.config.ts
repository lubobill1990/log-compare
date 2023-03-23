import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite';
import { comlink } from 'vite-plugin-comlink';
import eslint from 'vite-plugin-eslint';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), eslint(), comlink()],
  worker: {
    plugins: [comlink()],
  },
});
