import { type } from "arktype";

declare const process: { env?: Record<string, string | undefined> } | undefined;

/**
 * Creates a sub-millisecond prop contract validator using ArkType.
 * Stripped to a no-op when NODE_ENV === 'production'.
 */
export function createPropValidator<
	T extends Record<string, unknown> = Record<string, unknown>,
>(schemaDefinition: object): (props: unknown) => props is T {
	if (
		typeof process !== "undefined" &&
		process.env?.NODE_ENV === "production"
	) {
		return (_props: unknown): _props is T => true;
	}

	const validator = type(schemaDefinition);

	return (props: unknown): props is T => {
		const out = validator(props);
		if (out instanceof type.errors) {
			console.warn(
				`[Arkano Prop Mismatch] Component received invalid props:\n${out.summary}`,
			);
			return false;
		}
		return true;
	};
}
