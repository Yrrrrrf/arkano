import { copySync, ensureDirSync, existsSync } from "@std/fs";
import { join } from "@std/path";
import { generate404Html, generateHubHtml } from "./portal.ts";
import {
	banner,
	colors,
	formatAppTag,
	installSignalTraps,
	Select,
	spawnStreamingProcess,
} from "./engine.ts";
import { discoverPackages, getAppTargets } from "./workspace.ts";

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

export async function runDev(
	targetApp?: string,
	options: ServerOptions = {},
): Promise<void> {
	const apps = discoverPackages("apps");
	if (apps.length === 0) {
		console.warn(colors.yellow("No applications found in apps/"));
		return;
	}

	// Multi-app concurrent dev mode via --all / -A
	if (
		options.all ||
		targetApp === "all" ||
		targetApp === "--all" ||
		targetApp === "-A"
	) {
		installSignalTraps();
		const basePort = options.port ?? 5173;
		console.log(
			banner(
				`🚀 Starting ${apps.length} dev servers concurrently across apps:`,
				"magenta",
			),
		);

		const maxNameLen = Math.max(...apps.map((a) => a.name.length));
		for (let i = 0; i < apps.length; i++) {
			const app = apps[i];
			const port = basePort + i;
			const tag = formatAppTag(app.name, i, maxNameLen);
			console.log(`  • ${tag} ➜ http://localhost:${port}/ (${app.path})`);
		}
		console.log("");

		const abortController = new AbortController();
		const tasks = apps.map((app, i) => {
			const port = String(basePort + i);
			const tag = formatAppTag(app.name, i, maxNameLen);
			return spawnStreamingProcess({
				cmd: [
					"deno",
					"run",
					"-A",
					"npm:vite",
					"dev",
					"--port",
					port,
					"--clearScreen",
					"false",
					"--host",
					...(options.extraArgs ?? []),
				],
				cwd: app.path,
				signal: abortController.signal,
				onLine: (line) => {
					console.log(`  ${tag} ${colors.gray("│")} ${line}`);
				},
			});
		});

		await Promise.all(tasks);
		return;
	}

	let selectedApp = targetApp?.replace(/^apps\//, "");
	if (!selectedApp) {
		if (apps.length === 1) {
			selectedApp = apps[0].name;
		} else {
			console.log("");
			selectedApp = await Select.prompt({
				message: "Select app to run",
				options: apps.map((a) => ({ name: a.name, value: a.name })),
			});
		}
	}

	const appPath = `apps/${selectedApp}`;
	if (!existsSync(appPath)) {
		console.error(colors.red(`Application not found: ${appPath}`));
		Deno.exit(1);
	}

	console.log(banner(`🚀 Starting dev server: ${appPath}`, "magenta"));

	const cmd = new Deno.Command("deno", {
		args: [
			"run",
			"-A",
			"npm:vite",
			"dev",
			"--host",
			...(options.extraArgs ?? []),
		],
		cwd: appPath,
		stdout: "inherit",
		stderr: "inherit",
	});
	const status = await cmd.spawn().status;
	if (!status.success) Deno.exit(status.code);
}

// ── PREVIEW SERVER (SINGLE & CONCURRENT MULTI-APP) ─────────────────────

export async function runPreview(
	targetApp?: string,
	options: ServerOptions = {},
): Promise<void> {
	const apps = discoverPackages("apps");
	if (apps.length === 0) {
		console.warn(colors.yellow("No applications found in apps/"));
		return;
	}

	// Multi-app concurrent preview mode via --all / -A
	if (
		options.all ||
		targetApp === "all" ||
		targetApp === "--all" ||
		targetApp === "-A"
	) {
		installSignalTraps();
		const basePort = options.port ?? 4173;
		console.log(
			banner(
				`🎪 Previewing ${apps.length} production builds concurrently across apps:`,
				"magenta",
			),
		);

		const maxNameLen = Math.max(...apps.map((a) => a.name.length));
		for (let i = 0; i < apps.length; i++) {
			const app = apps[i];
			const port = basePort + i;
			const tag = formatAppTag(app.name, i, maxNameLen);
			console.log(`  • ${tag} ➜ http://localhost:${port}/ (${app.path})`);
		}
		console.log("");

		const abortController = new AbortController();
		const tasks = apps.map((app, i) => {
			const port = String(basePort + i);
			const tag = formatAppTag(app.name, i, maxNameLen);
			return spawnStreamingProcess({
				cmd: [
					"deno",
					"run",
					"-A",
					"npm:vite",
					"preview",
					"--port",
					port,
					"--host",
					...(options.extraArgs ?? []),
				],
				cwd: app.path,
				signal: abortController.signal,
				onLine: (line) => {
					console.log(`  ${tag} ${colors.gray("│")} ${line}`);
				},
			});
		});

		await Promise.all(tasks);
		return;
	}

	let selectedApp = targetApp?.replace(/^apps\//, "");
	if (!selectedApp) {
		if (apps.length === 1) {
			selectedApp = apps[0].name;
		} else {
			console.log("");
			selectedApp = await Select.prompt({
				message: "Select app to preview",
				options: apps.map((a) => ({ name: a.name, value: a.name })),
			});
		}
	}

	const appPath = `apps/${selectedApp}`;
	if (!existsSync(appPath)) {
		console.error(colors.red(`Application not found: ${appPath}`));
		Deno.exit(1);
	}

	console.log(banner(`🎪 Previewing production build: ${appPath}`, "magenta"));

	const cmd = new Deno.Command("deno", {
		args: [
			"run",
			"-A",
			"npm:vite",
			"preview",
			"--host",
			...(options.extraArgs ?? []),
		],
		cwd: appPath,
		stdout: "inherit",
		stderr: "inherit",
	});
	const status = await cmd.spawn().status;
	if (!status.success) Deno.exit(status.code);
}

// ── BUILD GATE ─────────────────────────────────────────────────────────

export async function runBuildGate(
	_options: GateOptions = {},
	targetApp?: string,
): Promise<void> {
	const targets = getAppTargets(targetApp);
	if (targets.length === 0) {
		console.warn(colors.yellow("No applications found in apps/"));
		Deno.exit(1);
	}

	for (const pkg of targets) {
		console.log(colors.bold.cyan(`\nBuilding ${pkg.name}...`));
		try {
			await Deno.remove(join(pkg.path, "build"), { recursive: true });
		} catch {
			// Ignored
		}
		try {
			await Deno.remove(join(pkg.path, "dist"), { recursive: true });
		} catch {
			// Ignored
		}

		const cmd = new Deno.Command("deno", {
			args: ["run", "-A", "npm:vite", "build"],
			cwd: pkg.path,
			stdout: "inherit",
			stderr: "inherit",
		});
		const status = await cmd.spawn().status;
		if (!status.success) Deno.exit(status.code);
	}

	console.log(colors.bold.green("\n✓ All applications built successfully."));
}

// ── GITHUB PAGES DEPLOY GATE ──────────────────────────────────────────

export interface PagesGateOptions extends GateOptions {
	readonly repo?: string;
	readonly push?: boolean;
}

export async function runPagesGate(
	options: PagesGateOptions = {},
): Promise<void> {
	const repo = options.repo ?? "arkane";
	const shouldPush = options.push !== false;
	const targets = getAppTargets();

	if (targets.length === 0) {
		console.warn(colors.yellow("No applications found in apps/"));
		Deno.exit(1);
	}

	console.log(
		banner(
			`📦 Building ${targets.length} applications for GitHub Pages (repo: ${repo})...`,
			"magenta",
		),
	);

	const rootDir = Deno.cwd();

	for (const pkg of targets) {
		console.log(colors.bold.cyan(`\nBuilding ${pkg.name} for GitHub Pages...`));
		try {
			await Deno.remove(join(pkg.path, "build"), { recursive: true });
		} catch {
			// Ignored
		}
		try {
			await Deno.remove(join(pkg.path, "dist"), { recursive: true });
		} catch {
			// Ignored
		}

		const cmd = new Deno.Command("deno", {
			args: [
				"run",
				"-A",
				"npm:vite",
				"build",
				"--base",
				`/${repo}/${pkg.name}/`,
			],
			cwd: pkg.path,
			env: {
				BASE_PATH: `/${repo}/${pkg.name}`,
			},
			stdout: "inherit",
			stderr: "inherit",
		});
		const status = await cmd.spawn().status;
		if (!status.success) {
			console.error(colors.red(`\n✗ Build failed for ${pkg.name}`));
			Deno.exit(status.code);
		}
	}

	// ── ASSEMBLE PAGES DIST DIRECTORY ─────────────────────────
	console.log(
		colors.bold.cyan("\n📦 Packaging GitHub Pages deployment bundle..."),
	);

	const stagingDir = join(rootDir, "build/gh-pages");
	try {
		await Deno.remove(stagingDir, { recursive: true });
	} catch {
		// Ignored
	}
	ensureDirSync(stagingDir);

	// 1. Copy each app build to staging
	for (const target of targets) {
		const appBuildDir = existsSync(join(rootDir, target.path, "build"))
			? join(rootDir, target.path, "build")
			: join(rootDir, target.path, "dist");
		const destDir = join(stagingDir, target.name);
		if (!existsSync(appBuildDir)) {
			console.error(
				colors.red(`Error: Build directory not found: ${appBuildDir}`),
			);
			Deno.exit(1);
		}
		copySync(appBuildDir, destDir, { overwrite: true });

		// Fallback 404 for SPA client-side routing within the app
		const indexPath = join(destDir, "index.html");
		const fallbackPath = join(destDir, "404.html");
		if (existsSync(indexPath) && !existsSync(fallbackPath)) {
			copySync(indexPath, fallbackPath);
		}
		console.log(
			`  ${colors.green("✓")} ${colors.bold(target.name)} SPA staged -> ${destDir}`,
		);
	}

	// 2. Add .nojekyll to prevent Jekyll from skipping _app / dot directories
	await Deno.writeTextFile(join(stagingDir, ".nojekyll"), "");
	console.log(`  ${colors.green("✓")} .nojekyll marker written`);

	// 3. Get commit SHA
	let commitSha = "latest";
	try {
		const gitRevCmd = new Deno.Command("git", {
			args: ["rev-parse", "--short", "HEAD"],
			cwd: rootDir,
			stdout: "piped",
			stderr: "null",
		});
		const out = await gitRevCmd.output();
		if (out.success) {
			commitSha = new TextDecoder().decode(out.stdout).trim();
		}
	} catch {
		// Ignored
	}

	// 4. Generate Hub portal index.html and root 404.html
	const hubHtml = generateHubHtml({
		repoName: repo,
		commitSha,
		timestamp: new Date().toISOString(),
	});
	await Deno.writeTextFile(join(stagingDir, "index.html"), hubHtml);
	console.log(
		`  ${colors.green("✓")} Multi-App Hub Portal generated -> index.html`,
	);

	const root404Html = generate404Html(repo);
	await Deno.writeTextFile(join(stagingDir, "404.html"), root404Html);
	console.log(
		`  ${colors.green("✓")} SPA routing fallback router generated -> 404.html`,
	);

	// ── PUSH TO GITHUB PAGES ──────────────────────────────────
	if (shouldPush) {
		console.log(
			colors.bold.magenta("\n🚀 Pushing to GitHub (branch: gh-pages)..."),
		);

		let remoteUrl = "";
		try {
			const gitRemoteCmd = new Deno.Command("git", {
				args: ["remote", "get-url", "origin"],
				cwd: rootDir,
				stdout: "piped",
				stderr: "null",
			});
			const out = await gitRemoteCmd.output();
			if (out.success) {
				remoteUrl = new TextDecoder().decode(out.stdout).trim();
			}
		} catch {
			// Ignored
		}

		if (!remoteUrl) {
			console.error(
				colors.red("Error: Git remote 'origin' not configured. Push aborted."),
			);
			Deno.exit(1);
		}

		const runGit = async (args: string[]) => {
			const cmd = new Deno.Command("git", {
				args,
				cwd: stagingDir,
				stdout: "inherit",
				stderr: "inherit",
			});
			const status = await cmd.spawn().status;
			if (!status.success) {
				throw new Error(`Git command failed: git ${args.join(" ")}`);
			}
		};

		try {
			await runGit(["init", "-b", "gh-pages"]);
			await runGit(["add", "-A"]);
			await runGit([
				"commit",
				"-m",
				`deploy(pages): publish 3 SPAs (react, vue, svelte) at ${commitSha} [skip ci]`,
			]);
			await runGit(["remote", "add", "origin", remoteUrl]);
			await runGit(["push", "-f", "origin", "gh-pages"]);
			console.log(
				colors.bold.green("✓ Successfully pushed gh-pages branch to origin!"),
			);

			// Ensure GitHub Pages is enabled on the repository
			try {
				const ghPagesCheck = new Deno.Command("gh", {
					args: ["api", `repos/Yrrrrrf/${repo}/pages`],
					stdout: "null",
					stderr: "null",
				});
				const checkStatus = await ghPagesCheck.spawn().status;
				if (!checkStatus.success) {
					console.log(colors.cyan("Enabling GitHub Pages on repository..."));
					const ghPagesEnable = new Deno.Command("gh", {
						args: [
							"api",
							"--method",
							"POST",
							`repos/Yrrrrrf/${repo}/pages`,
							"-f",
							"source[branch]=gh-pages",
							"-f",
							"source[path]=/",
						],
						stdout: "null",
						stderr: "null",
					});
					await ghPagesEnable.spawn().status;
				}
			} catch {
				// Ignored
			}

			console.log(
				banner(
					`\n🎉 GitHub Pages Live:\n` +
						`  • Hub Portal: https://yrrrrrf.github.io/${repo}/\n` +
						`  • React Showcase: https://yrrrrrf.github.io/${repo}/react/\n` +
						`  • Vue Showcase: https://yrrrrrf.github.io/${repo}/vue/\n` +
						`  • Svelte Native: https://yrrrrrf.github.io/${repo}/svelte/\n`,
					"green",
				),
			);
		} catch (err) {
			console.error(colors.red(`Failed to push to gh-pages: ${err}`));
			Deno.exit(1);
		}
	} else {
		console.log(
			colors.bold.green(
				`\n✓ GitHub Pages deployment bundle staged at build/gh-pages/ (--no-push active)`,
			),
		);
	}
}
