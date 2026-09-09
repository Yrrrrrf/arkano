// workspace.ts — Dynamic workspace discovery and lifecycle maintenance for Arkane
import { existsSync, walkSync } from 'jsr:@std/fs@1.0.8';
import { join, relative } from 'jsr:@std/path@1.0.8';
import { colors } from './engine.ts';

export interface ClientPackage {
  readonly name: string;
  readonly path: string;
  readonly isApp: boolean;
  readonly isSvelte: boolean;
  readonly hasTests: boolean;
  readonly engine: string;
  readonly entrypoint: string;
}

function hasPattern(dir: string, regex: RegExp): boolean {
  if (!existsSync(dir)) return false;
  try {
    for (const entry of walkSync(dir, { maxDepth: 4 })) {
      if (regex.test(entry.path)) return true;
    }
  } catch {
    // Ignore access errors
  }
  return false;
}

export function inspectPackage(pkgDir: string): ClientPackage {
  const clean = pkgDir.replaceAll('\\', '/');
  const parts = clean.split('/').filter(Boolean);
  const name = parts[parts.length - 1] ?? clean;
  const isApp = clean.startsWith('apps/') || clean.includes('/apps/');

  const hasVite =
    existsSync(join(clean, 'vite.config.ts')) ||
    existsSync(join(clean, 'vite.config.mts')) ||
    existsSync(join(clean, 'vite.config.js'));

  const hasSvelteFiles = hasPattern(join(clean, 'src'), /\.(svelte|svelte\.ts)$/);
  const isSvelteKit = existsSync(join(clean, 'src/routes'));
  const isSvelte = hasSvelteFiles || isSvelteKit;

  const hasTests = hasPattern(clean, /\.(test|spec)\.(ts|tsx|js|jsx)$/);

  const entrypoint = existsSync(join(clean, 'src/lib/mod.ts'))
    ? 'src/lib/mod.ts'
    : existsSync(join(clean, 'src/mod.ts'))
      ? 'src/mod.ts'
      : existsSync(join(clean, 'src/main.tsx'))
        ? 'src/main.tsx'
        : existsSync(join(clean, 'src/main.ts'))
          ? 'src/main.ts'
          : 'src/mod.ts';

  return {
    name,
    path: clean,
    isApp,
    isSvelte,
    hasTests,
    engine: isSvelte || hasVite ? 'vitest' : 'deno',
    entrypoint,
  };
}

export function discoverPackages(dirName: 'apps' = 'apps'): ClientPackage[] {
  const root = Deno.cwd();
  const targetDir = join(root, dirName);
  if (!existsSync(targetDir)) return [];

  const pkgs: ClientPackage[] = [];
  for (const entry of Deno.readDirSync(targetDir)) {
    if (entry.isDirectory) {
      pkgs.push(inspectPackage(`${dirName}/${entry.name}`));
    }
  }
  return pkgs.sort((a, b) => a.name.localeCompare(b.name));
}

export function getAppTargets(appFilter?: string): ClientPackage[] {
  const apps = discoverPackages('apps');
  if (!appFilter || appFilter === 'all' || appFilter === '--all' || appFilter === '-A') {
    return apps;
  }

  const clean = appFilter.replaceAll('\\', '').replace(/^apps\//, '');
  const match = apps.find((a) => a.name === clean);
  if (!match) {
    console.error(colors.red(`Application not found: apps/${clean}`));
    Deno.exit(1);
  }
  return [match];
}

/**
 * Ensures node_modules/vite symlink and compat are present for Deno.
 */
export function ensureNodeCompat(): void {
  const root = Deno.cwd();
  const nm = join(root, 'node_modules');
  const viteSymlink = join(nm, 'vite');

  if (existsSync(nm)) {
    const denoNm = join(nm, '.deno');
    if (existsSync(denoNm)) {
      try {
        if (!existsSync(viteSymlink)) {
          for (const entry of Deno.readDirSync(denoNm)) {
            if (entry.name.startsWith('vite@')) {
              const viteTarget = join(denoNm, entry.name, 'node_modules', 'vite');
              if (existsSync(viteTarget)) {
                const rel = relative(nm, viteTarget);
                try {
                  Deno.symlinkSync(rel, viteSymlink);
                } catch {
                  // Ignore
                }
                break;
              }
            }
          }
        }
      } catch {
        // Ignored
      }
    }
  }
}
