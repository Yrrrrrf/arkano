// main.ts — Master Cliffy CLI driver for Arkane applications
import { Command } from "jsr:@cliffy/command@1.2.1";
import { CompletionsCommand } from "jsr:@cliffy/command@1.2.1/completions";
import { HelpCommand } from "jsr:@cliffy/command@1.2.1/help";
import { runBuildGate, runDev, runPagesGate, runPreview } from "./gates.ts";
import { ensureNodeCompat } from "./workspace.ts";

interface GlobalOptions {
	readonly verbose?: boolean;
	readonly parallel?: boolean;
	readonly bench?: boolean;
	readonly failFast?: boolean;
	readonly filter?: string;
}

const cli = new Command()
	.name("arkane")
	.version("1.0.0")
	.description("High-performance CLI driver for Arkane applications")
	.default("help")
	.globalOption("-v, --verbose", "Show verbose process logs")
	.globalOption("-p, --parallel", "Execute tasks concurrently")
	.globalOption("-b, --bench", "Display task duration benchmarks")
	.globalOption("--fail-fast", "Abort execution immediately on first error")
	.globalOption("-f, --filter <pattern:string>", "Filter targets by name")
	.command("help", new HelpCommand().global())
	.command("completions", new CompletionsCommand())
	// ── DEV ─────────────────────────────────────────────────────────────
	.command("dev [app:string]", "Start development server for app")
	.option("-A, --all", "Start dev servers for all applications concurrently")
	.option("--port <port:number>", "Base port number", { default: 5173 })
	.action(
		async (
			options: GlobalOptions & { all?: boolean; port?: number },
			app?: string,
		) => {
			ensureNodeCompat();
			await runDev(app, {
				all: options.all || app === "all" || app === "--all" || app === "-A",
				port: options.port,
			});
		},
	)
	// ── PREVIEW ─────────────────────────────────────────────────────────
	.command("preview [app:string]", "Preview production bundle")
	.option("-A, --all", "Preview all applications concurrently")
	.option("--port <port:number>", "Base port number", { default: 4173 })
	.action(
		async (
			options: GlobalOptions & { all?: boolean; port?: number },
			app?: string,
		) => {
			ensureNodeCompat();
			await runPreview(app, {
				all: options.all || app === "all" || app === "--all" || app === "-A",
				port: options.port,
			});
		},
	)
	// ── BUILD ───────────────────────────────────────────────────────────
	.command("build [app:string]", "Build production bundle for apps")
	.option("-A, --all", "Build all applications")
	.action(async (options: GlobalOptions & { all?: boolean }, app?: string) => {
		ensureNodeCompat();
		const targetApp = options.all ? undefined : app;
		await runBuildGate(
			{
				verbose: options.verbose,
				parallel: options.parallel,
				bench: options.bench,
				failFast: options.failFast,
			},
			targetApp,
		);
	})
	// ── PAGES ───────────────────────────────────────────────────────────
	.command(
		"pages",
		"Build all 3 apps and deploy to GitHub Pages (gh-pages branch)",
	)
	.option("--repo <repo:string>", "GitHub repository name", {
		default: "arkane",
	})
	.option(
		"--no-push",
		"Assemble deployment bundle locally without pushing to GitHub",
	)
	.action(
		async (options: GlobalOptions & { repo?: string; push?: boolean }) => {
			ensureNodeCompat();
			await runPagesGate({
				verbose: options.verbose,
				parallel: options.parallel,
				repo: options.repo,
				push: options.push,
			});
		},
	)
	// ── COMPAT ──────────────────────────────────────────────────────────
	.command("compat", "Ensure node_modules symlinks and compatibility layer")
	.action(() => {
		ensureNodeCompat();
	});

if (import.meta.main) {
	await cli.parse(Deno.args);
}
