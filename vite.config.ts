import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Attempt to load Tailwind, but don't crash the whole config if native bindings fail
let tailwindcss: any = null;
try {
  const mod = await import('@tailwindcss/vite');
  tailwindcss = mod.default;
} catch (e) {
  console.warn('\n[\u26a0\ufe0f  Tailwind Warning]: Could not load Tailwind CSS v4 native engine.');
  console.warn('This is common on Linux if native bindings are missing.');
  console.warn('Run: npm install @tailwindcss/oxide-linux-x64-gnu (or your specific arch plugin)\n');
}

export default defineConfig({
  plugins: [
    react(),
    ...(tailwindcss ? [tailwindcss()] : [])
  ],
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
