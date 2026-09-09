import { describe, expect, it } from "vite-plus/test";
import pkg from "../deno.json" with { type: "json" };
import { faviconUrl } from "./lib/mod.ts";

describe("React App", () => {
	it("has valid package metadata and assets", () => {
		expect(pkg.name).toBe("@apps/react");
		expect(typeof faviconUrl).toBe("string");
	});
});
