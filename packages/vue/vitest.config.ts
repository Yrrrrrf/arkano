import { defineConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [vue(), svelte({ compilerOptions: { runes: true } })],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    name: 'vue',
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});
