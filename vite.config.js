import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
  plugins: [
    {
      name: 'copy-resources',
      closeBundle() {
        const src = path.resolve('Resources');
        const dest = path.resolve('dist/Resources');
        if (fs.existsSync(src)) {
          fs.mkdirSync(dest, { recursive: true });
          fs.cpSync(src, dest, { recursive: true });
          console.log('Successfully copied Resources to dist/Resources');
        }
      },
    },
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
