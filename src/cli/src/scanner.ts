import { walk } from 'jsr:@std/fs/walk';
import { basename, resolve } from 'node:path';

export interface SvelteComponentMeta {
  name: string;
  path: string;
  relativePath: string;
}

/**
 * Recursively scans directory for .svelte components.
 */
export async function scanSvelteComponents(dir: string): Promise<SvelteComponentMeta[]> {
  const components: SvelteComponentMeta[] = [];
  const absDir = resolve(dir);

  for await (const entry of walk(absDir, { exts: ['.svelte'], includeDirs: false })) {
    const rawName = basename(entry.path, '.svelte');
    const sanitizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    components.push({
      name: sanitizedName,
      path: entry.path,
      relativePath: entry.path.slice(absDir.length + 1),
    });
  }

  return components.sort((a, b) => a.name.localeCompare(b.name));
}
