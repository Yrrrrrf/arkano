import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [
    {
      name: 'resolve-jsr-std-fs',
      resolveId(id) {
        if (id === 'jsr:@std/fs/ensure-dir' || id === 'jsr:@std/fs/walk') {
          return id;
        }
      },
      load(id) {
        if (id === 'jsr:@std/fs/ensure-dir') {
          return `
            import { mkdir } from 'node:fs/promises';
            export async function ensureDir(dir) {
              await mkdir(dir, { recursive: true });
            }
          `;
        }
        if (id === 'jsr:@std/fs/walk') {
          return `
            import { readdir } from 'node:fs/promises';
            import { join } from 'node:path';
            export async function* walk(dir, options = {}) {
              const entries = await readdir(dir, { withFileTypes: true, recursive: true });
              for (const entry of entries) {
                const fullPath = join(entry.parentPath || dir, entry.name);
                if (entry.isFile() && (!options.exts || options.exts.some(ext => entry.name.endsWith(ext)))) {
                  yield { path: fullPath, name: entry.name, isFile: true, isDirectory: false, isSymlink: false };
                }
              }
            }
          `;
        }
      },
    },
  ],
  test: {
    name: 'cli',
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
