import { useState } from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Arkane } from "../src/host.svelte.ts";
// @ts-expect-error - Svelte fixture import
import Counter from "../../../fixtures/components/Counter.svelte";

describe("React 19 <Arkane /> Host", () => {
	it("renders with layout-invisible display: contents container", () => {
		const { container } = render(<Arkane this={Counter} initial={0} />);
		const hostElement = container.querySelector("span");
		expect(hostElement).not.toBeNull();
		expect(hostElement?.style.display).toBe("contents");
	});

	it("renders custom container tag with className", () => {
		const { container } = render(
			<Arkane
				this={Counter}
				as="div"
				className="arkane-custom-host"
				initial={5}
			/>,
		);
		const hostElement = container.querySelector("div.arkane-custom-host");
		expect(hostElement).not.toBeNull();
		expect(hostElement?.style.display).toBe("contents");
		expect(screen.getByText("5")).not.toBeNull();
	});

	it("updates props fine-grained without remounting Svelte component", async () => {
		function Parent() {
			const [count, setCount] = useState(1);
			return (
				<div>
					<button type="button" onClick={() => setCount((c) => c + 1)}>
						Increment Parent
					</button>
					<Arkane this={Counter} count={count} />
				</div>
			);
		}

		render(<Parent />);
		expect(screen.getByText("1")).not.toBeNull();

		// Trigger parent re-render with new prop
		const button = screen.getByText("Increment Parent");
		await act(async () => {
			button.click();
		});

		expect(screen.getByText("2")).not.toBeNull();
	});

	it("forwards React 19 ref directly to host DOM element", () => {
		let capturedRef: HTMLElement | null = null;
		function RefConsumer() {
			return (
				<Arkane
					this={Counter}
					ref={(node) => {
						capturedRef = node;
					}}
				/>
			);
		}

		render(<RefConsumer />);
		expect(capturedRef).not.toBeNull();
		expect((capturedRef as HTMLElement | null)?.tagName.toLowerCase()).toBe(
			"span",
		);
	});
});
