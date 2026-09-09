import { colors } from "@cliffy/ansi/colors";
import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { emitWrapper } from "./emitter.ts";
import { scanSvelteComponents } from "./scanner.ts";

void (async () => {
	await new Command()
		.name("arkane")
		.version("1.0.0")
		.description(
			"⚡ Inscribe Svelte 5 Runes into foreign soil — Universal Adapter CLI",
		)
		.command(
			"generate",
			"Generate typed React and Vue component adapters from Svelte 5 files",
		)
		.option(
			"-i, --in <dir:string>",
			"Input directory containing .svelte components",
			{
				default: "./fixtures/components",
			},
		)
		.option(
			"-o, --out <dir:string>",
			"Output directory for generated adapters",
			{
				default: "./dist/adapters",
			},
		)
		.option(
			"-t, --target <framework:string>",
			"Target framework: 'react', 'vue', or 'all'",
			{
				default: "all",
			},
		)
		.action(async ({ in: inDir, out: outDir, target }) => {
			console.log(
				colors.bold.cyan("\n⚡ ARKANE: Generating universal conduits...\n"),
			);

			const components = await scanSvelteComponents(inDir);
			const table = new Table().header([
				colors.bold("Component"),
				colors.bold("Target"),
				colors.bold("Status"),
			]);

			for (const comp of components) {
				if (target === "react" || target === "all") {
					await emitWrapper({
						componentPath: comp.path,
						componentName: comp.name,
						outputDir: `${outDir}/react`,
						target: "react",
						bindableProps: comp.bindableProps,
					});
					table.push([
						comp.name,
						colors.blue("React 19"),
						colors.green("✔ Emitted"),
					]);
				}

				if (target === "vue" || target === "all") {
					await emitWrapper({
						componentPath: comp.path,
						componentName: comp.name,
						outputDir: `${outDir}/vue`,
						target: "vue",
						bindableProps: comp.bindableProps,
					});
					table.push([
						comp.name,
						colors.green("Vue 3.5"),
						colors.green("✔ Emitted"),
					]);
				}
			}

			table.render();
			console.log(
				colors.bold.green(
					`\n✔ Successfully generated adapters for ${components.length} components.\n`,
				),
			);
		})
		.parse(Deno.args);
})();
