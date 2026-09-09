import { walk } from "@std/fs";
import { basename, resolve } from "@std/path";

export interface SvelteComponentMeta {
	name: string;
	path: string;
	relativePath: string;
	props: string[];
	bindableProps: string[];
}

/**
 * Parses Svelte 5 component script block for $props() and $bindable() runes.
 */
export function parseRunesProps(source: string): {
	props: string[];
	bindableProps: string[];
} {
	const props: string[] = [];
	const bindableProps: string[] = [];

	const scriptMatch = source.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
	if (!scriptMatch) {
		return { props, bindableProps };
	}

	const scriptContent = scriptMatch[1];
	// Match destructuring pattern: let/const { ... } = $props()
	const propsMatch = scriptContent.match(
		/(?:let|const)\s*\{([\s\S]*?)\}(?:\s*:\s*[\w<>]+)?\s*=\s*\$props\(\s*\)/,
	);
	if (propsMatch) {
		const destructuredContent = propsMatch[1];
		// Split by commas outside of parentheses
		const parts: string[] = [];
		let current = "";
		let parenDepth = 0;
		for (const char of destructuredContent) {
			if (char === "(") parenDepth++;
			else if (char === ")") parenDepth--;
			if (char === "," && parenDepth === 0) {
				if (current.trim()) parts.push(current.trim());
				current = "";
			} else {
				current += char;
			}
		}
		if (current.trim()) parts.push(current.trim());

		for (const part of parts) {
			const isBindable =
				part.includes("$bindable(") || part.includes("$bindable");
			let propName = part;
			if (propName.includes("=")) {
				propName = propName.slice(0, propName.indexOf("=")).trim();
			}
			if (propName.includes(":")) {
				propName = propName.slice(0, propName.indexOf(":")).trim();
			}
			propName = propName.trim();
			if (propName) {
				props.push(propName);
				if (isBindable) {
					bindableProps.push(propName);
				}
			}
		}
	}

	return { props, bindableProps };
}

/**
 * Recursively scans directory for .svelte components and extracts runes metadata.
 */
export async function scanSvelteComponents(
	dir: string,
): Promise<SvelteComponentMeta[]> {
	const components: SvelteComponentMeta[] = [];
	const absDir = resolve(dir);

	for await (const entry of walk(absDir, {
		exts: [".svelte"],
		includeDirs: false,
	})) {
		const rawName = basename(entry.path, ".svelte");
		const sanitizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
		let source = "";
		try {
			source = await Deno.readTextFile(entry.path);
		} catch {
			// Ignore read error
		}
		const { props, bindableProps } = parseRunesProps(source);

		components.push({
			name: sanitizedName,
			path: entry.path,
			relativePath: entry.path.slice(absDir.length + 1),
			props,
			bindableProps,
		});
	}

	return components.sort((a, b) => a.name.localeCompare(b.name));
}
