/// <reference types="vite/client" />
/// <reference types="svelte" />

declare module "*.svelte" {
	import type { Component } from "svelte";
	import type { ComponentType } from "react";
	import type { DefineComponent } from "vue";

	const component: Component<Record<string, unknown>, Record<string, unknown>> &
		ComponentType<Record<string, unknown>> &
		DefineComponent<Record<string, unknown>, Record<string, unknown>>;
	export default component;
}
