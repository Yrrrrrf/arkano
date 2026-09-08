import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [react(), vue(), svelte({ compilerOptions: { runes: true } })],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    name: 'showcase',
    globals: true,
    environment: 'jsdom',
    include: ['showcase.test.tsx', '**/*.test.tsx', '**/*.test.ts'],
  },
});
