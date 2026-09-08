import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    globals: true,
    projects: [
      './src/*/vitest.config.ts',
      './fixtures/vitest.config.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/src/**/*.ts', 'src/**/src/**/*.svelte.ts']
    },
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.jj/**',
      '**/dist/**',
      '**/build/**'
    ]
  }
});
