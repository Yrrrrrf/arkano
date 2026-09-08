import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    name: 'vite',
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
