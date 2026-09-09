import { render, screen } from "@testing-library/react";
import { mount as mountVue } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { arkano as reactArkano } from "../src/react/src/index.ts";
import { arkano as vueArkano } from "../src/vue/src/index.ts";
// @ts-expect-error - Svelte fixture import
import Counter from "./components/Counter.svelte";
// @ts-expect-error - Svelte fixture import
import Icon from "./components/Icon.svelte";

describe("Arkano Universal Host End-to-End Showcase", () => {
	it("mounts Svelte Counter in React 19 inside DaisyUI .join container with display: contents", () => {
		const ReactCounter = reactArkano(Counter);

		const { container } = render(
			<div data-theme="synthwave" className="p-4">
				{/* DaisyUI join container expects direct flex children without element boxes */}
				<div className="join">
					<button type="button" className="btn join-item">
						React Native Button
					</button>
					<ReactCounter initial={10} className="join-item" />
				</div>
			</div>,
		);

		// Assert host wrapper exists with display: contents
		const hostSpan = container.querySelector(
			'span[style*="display: contents"]',
		);
		expect(hostSpan).not.toBeNull();

		// Assert button inside Svelte component rendered
		expect(screen.getByText("10")).not.toBeNull();
		expect(screen.getByText("Increment")).not.toBeNull();
	});

	it("mounts Svelte Icon in Vue 3.5 with dynamic route derived paths", () => {
		const VueIcon = vueArkano(Icon);

		const wrapper = mountVue(VueIcon, {
			attrs: {
				route: "/dashboard",
				size: 32,
			},
		});

		const svg = wrapper.find("svg");
		expect(svg.exists()).toBe(true);
		expect(svg.attributes("width")).toBe("32");
	});
});
