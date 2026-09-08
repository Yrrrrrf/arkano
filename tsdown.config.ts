import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    'core/index': 'src/core/src/index.ts',
    'react/index': 'src/react/src/index.ts',
    'vue/index': 'src/vue/src/index.ts',
    'vite/index': 'src/vite/src/index.ts',
    'cli/bin': 'src/cli/src/bin.ts'
  },
  format: ['esm', 'cjs'],
  dts: {
    isolatedDeclarations: true
  },
  clean: true,
  copy: ['index.html'],
  bundleless: false,
  platform: 'neutral',
  deps: {
    neverBundle: [
      'svelte',
      'react',
      'react-dom',
      'vue',
      'vite',
      'arktype',
      '@cliffy/command',
      '@cliffy/table',
      '@cliffy/ansi',
      'jsr:@std/fs/ensure-dir',
      'jsr:@std/fs/walk',
      'node:path'
    ]
  }
});
