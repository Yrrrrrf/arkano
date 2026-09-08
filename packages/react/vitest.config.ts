import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [react(), svelte({ compilerOptions: { runes: true } })],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    name: 'react',
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.tsx', 'tests/**/*.test.ts'],
  },
});
