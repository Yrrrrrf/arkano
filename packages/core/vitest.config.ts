import { defineConfig } from 'vite-plus';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { runes: true } })],
  test: {
    name: 'core',
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
