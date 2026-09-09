import react from "@vitejs/plugin-react";
import { arkane, defineGWA, type PluginOption } from "../../config/app.config.ts";

export default defineGWA({
	plugins: [
		react() as PluginOption,
		arkane({ target: "react" }) as PluginOption,
	],
	overrides: {
		test: {
			name: "app:react",
		},
	},
});
