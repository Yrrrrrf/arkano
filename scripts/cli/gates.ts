// gates.ts — Quality gates, dev server orchestration, and preview server
import { existsSync } from 'jsr:@std/fs@1.0.8';
import { join } from 'jsr:@std/path@1.0.8';
import {
  banner,
  colors,
  formatAppTag,
  installSignalTraps,
  Select,
  spawnStreamingProcess,
} from './engine.ts';
import { discoverPackages, getAppTargets } from './workspace.ts';

export interface GateOptions {
  readonly verbose?: boolean;
  readonly parallel?: boolean;
  readonly bench?: boolean;
  readonly failFast?: boolean;
  readonly filter?: string;
}

export interface ServerOptions {
  readonly all?: boolean;
  readonly port?: number;
  readonly extraArgs?: readonly string[];
}

// ── DEV SERVER (SINGLE & CONCURRENT MULTI-APP) ─────────────────────────

export async function runDev(targetApp?: string, options: ServerOptions = {}): Promise<void> {
  const apps = discoverPackages('apps');
  if (apps.length === 0) {
    console.warn(colors.yellow('No applications found in apps/'));
    return;
  }

  // Multi-app concurrent dev mode via --all / -A
  if (options.all || targetApp === 'all' || targetApp === '--all' || targetApp === '-A') {
    installSignalTraps();
    const basePort = options.port ?? 5173;
    console.log(
      banner(`🚀 Starting ${apps.length} dev servers concurrently across apps:`, 'magenta'),
    );

    const maxNameLen = Math.max(...apps.map((a) => a.name.length));
    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];
      const port = basePort + i;
      const tag = formatAppTag(app.name, i, maxNameLen);
      console.log(`  • ${tag} ➜ http://localhost:${port}/ (${app.path})`);
    }
    console.log('');

    const abortController = new AbortController();
    const tasks = apps.map((app, i) => {
      const port = String(basePort + i);
      const tag = formatAppTag(app.name, i, maxNameLen);
      return spawnStreamingProcess({
        cmd: [
          'deno',
          'run',
          '-A',
          'npm:vite',
          'dev',
          '--port',
          port,
          '--clearScreen',
          'false',
          '--host',
          ...(options.extraArgs ?? []),
        ],
        cwd: app.path,
        signal: abortController.signal,
        onLine: (line) => {
          console.log(`  ${tag} ${colors.gray('│')} ${line}`);
        },
      });
    });

    await Promise.all(tasks);
    return;
  }

  let selectedApp = targetApp?.replace(/^apps\//, '');
  if (!selectedApp) {
    if (apps.length === 1) {
      selectedApp = apps[0].name;
    } else {
      console.log('');
      selectedApp = await Select.prompt({
        message: 'Select app to run',
        options: apps.map((a) => ({ name: a.name, value: a.name })),
      });
    }
  }

  const appPath = `apps/${selectedApp}`;
  if (!existsSync(appPath)) {
    console.error(colors.red(`Application not found: ${appPath}`));
    Deno.exit(1);
  }

  console.log(banner(`🚀 Starting dev server: ${appPath}`, 'magenta'));

  const cmd = new Deno.Command('deno', {
    args: ['run', '-A', 'npm:vite', 'dev', '--host', ...(options.extraArgs ?? [])],
    cwd: appPath,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await cmd.spawn().status;
  if (!status.success) Deno.exit(status.code);
}

// ── PREVIEW SERVER (SINGLE & CONCURRENT MULTI-APP) ─────────────────────

export async function runPreview(targetApp?: string, options: ServerOptions = {}): Promise<void> {
  const apps = discoverPackages('apps');
  if (apps.length === 0) {
    console.warn(colors.yellow('No applications found in apps/'));
    return;
  }

  // Multi-app concurrent preview mode via --all / -A
  if (options.all || targetApp === 'all' || targetApp === '--all' || targetApp === '-A') {
    installSignalTraps();
    const basePort = options.port ?? 4173;
    console.log(
      banner(`🎪 Previewing ${apps.length} production builds concurrently across apps:`, 'magenta'),
    );

    const maxNameLen = Math.max(...apps.map((a) => a.name.length));
    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];
      const port = basePort + i;
      const tag = formatAppTag(app.name, i, maxNameLen);
      console.log(`  • ${tag} ➜ http://localhost:${port}/ (${app.path})`);
    }
    console.log('');

    const abortController = new AbortController();
    const tasks = apps.map((app, i) => {
      const port = String(basePort + i);
      const tag = formatAppTag(app.name, i, maxNameLen);
      return spawnStreamingProcess({
        cmd: [
          'deno',
          'run',
          '-A',
          'npm:vite',
          'preview',
          '--port',
          port,
          '--host',
          ...(options.extraArgs ?? []),
        ],
        cwd: app.path,
        signal: abortController.signal,
        onLine: (line) => {
          console.log(`  ${tag} ${colors.gray('│')} ${line}`);
        },
      });
    });

    await Promise.all(tasks);
    return;
  }

  let selectedApp = targetApp?.replace(/^apps\//, '');
  if (!selectedApp) {
    if (apps.length === 1) {
      selectedApp = apps[0].name;
    } else {
      console.log('');
      selectedApp = await Select.prompt({
        message: 'Select app to preview',
        options: apps.map((a) => ({ name: a.name, value: a.name })),
      });
    }
  }

  const appPath = `apps/${selectedApp}`;
  if (!existsSync(appPath)) {
    console.error(colors.red(`Application not found: ${appPath}`));
    Deno.exit(1);
  }

  console.log(banner(`🎪 Previewing production build: ${appPath}`, 'magenta'));

  const cmd = new Deno.Command('deno', {
    args: ['run', '-A', 'npm:vite', 'preview', '--host', ...(options.extraArgs ?? [])],
    cwd: appPath,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await cmd.spawn().status;
  if (!status.success) Deno.exit(status.code);
}

// ── BUILD GATE ─────────────────────────────────────────────────────────

export async function runBuildGate(_options: GateOptions = {}, targetApp?: string): Promise<void> {
  const targets = getAppTargets(targetApp);
  if (targets.length === 0) {
    console.warn(colors.yellow('No applications found in apps/'));
    Deno.exit(1);
  }

  for (const pkg of targets) {
    console.log(colors.bold.cyan(`\nBuilding ${pkg.name}...`));
    try {
      await Deno.remove(join(pkg.path, 'build'), { recursive: true });
    } catch {
      // Ignored
    }
    try {
      await Deno.remove(join(pkg.path, 'dist'), { recursive: true });
    } catch {
      // Ignored
    }

    const cmd = new Deno.Command('deno', {
      args: ['run', '-A', 'npm:vite', 'build'],
      cwd: pkg.path,
      stdout: 'inherit',
      stderr: 'inherit',
    });
    const status = await cmd.spawn().status;
    if (!status.success) Deno.exit(status.code);
  }

  console.log(colors.bold.green('\n✓ All applications built successfully.'));
}
