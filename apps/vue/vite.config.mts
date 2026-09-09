import vue from "@vitejs/plugin-vue";
import { arkano, defineGWA, type PluginOption } from "../../config/app.config.ts";

export default defineGWA({
	plugins: [
		vue() as PluginOption,
		arkano({ target: "vue" }) as PluginOption,
	],
	overrides: {
		test: {
			name: "app:vue",
		},
	},
});
