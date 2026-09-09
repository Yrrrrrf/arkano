import { describe, expect, it } from "vitest";
import { normalizeEventName } from "../src/events.ts";
import { sanitizeProps } from "../src/proxy.svelte.ts";

describe("Event Normalizer", () => {
	it("maps known React camelCase events to Svelte lowercase equivalents", () => {
		expect(normalizeEventName("onClick")).toBe("onclick");
		expect(normalizeEventName("onChange")).toBe("onchange");
		expect(normalizeEventName("onInput")).toBe("oninput");
		expect(normalizeEventName("onKeyDown")).toBe("onkeydown");
		expect(normalizeEventName("onMouseEnter")).toBe("onmouseenter");
		expect(normalizeEventName("onSubmit")).toBe("onsubmit");
	});

	it("normalizes custom camelCase callback props", () => {
		expect(normalizeEventName("onSelect")).toBe("onselect");
		expect(normalizeEventName("onCustomFilter")).toBe("oncustomfilter");
		expect(normalizeEventName("onValueChange")).toBe("onvaluechange");
	});

	it("preserves non-event prop names intact", () => {
		expect(normalizeEventName("className")).toBe("className");
		expect(normalizeEventName("count")).toBe("count");
		expect(normalizeEventName("only")).toBe("only");
	});

	it("sanitizes and injects both casing keys into props dictionary", () => {
		const fn = () => {};
		const sanitized = sanitizeProps({
			onClick: fn,
			count: 10,
			children: "ignore",
		});
		expect(sanitized.onClick).toBe(fn);
		expect(sanitized.onclick).toBe(fn);
		expect(sanitized.count).toBe(10);
		expect("children" in sanitized).toBe(false);
	});
});
