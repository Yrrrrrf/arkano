import react from "@vitejs/plugin-react";
import { arkano, defineGWA, type PluginOption } from "../app.config.ts";

export default defineGWA({
	plugins: [
		react() as PluginOption,
		arkano({ target: "react" }) as PluginOption,
	],
	overrides: {
		test: {
			name: "app:react",
		},
	},
});
