import vue from "@vitejs/plugin-vue";
import { arkane, defineGWA, type PluginOption } from "../../config/app.config.ts";

export default defineGWA({
	plugins: [
		vue() as PluginOption,
		arkane({ target: "vue" }) as PluginOption,
	],
	overrides: {
		test: {
			name: "app:vue",
		},
	},
});
