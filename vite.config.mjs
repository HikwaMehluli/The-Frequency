import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  base: './',
  build: {
    outDir: 'docs',
    assetsDir: 'assets',
    copyPublicDir: true,
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
});
