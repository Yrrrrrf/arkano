import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    globals: true,
    projects: [
      './packages/*/vitest.config.ts',
      './packages/*/vite.config.ts',
      './fixtures/vitest.config.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.jj/**',
      '**/dist/**',
      '**/build/**'
    ]
  }
});
