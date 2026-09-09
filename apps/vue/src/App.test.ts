import { describe, expect, it } from "vite-plus/test";
import pkg from "../deno.json" with { type: "json" };
import { faviconUrl } from "./lib/mod.ts";

describe("Vue App", () => {
	it("has valid package metadata and assets", () => {
		expect(pkg.name).toBe("@apps/vue");
		expect(typeof faviconUrl).toBe("string");
	});
});
