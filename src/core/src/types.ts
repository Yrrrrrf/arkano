/**
 * Supported container DOM element tags for layout-invisible wrappers.
 */
export type SupportedHostTag =
	| "span"
	| "div"
	| "section"
	| "article"
	| "header"
	| "footer"
	| "main";

/**
 * Base adapter options shared across React and Vue higher-order components.
 */
export interface BaseAdapterOptions {
	/** HTML host container tag. Defaults to 'span' with display: contents */
	as?: SupportedHostTag;
	/** Optional class name applied to the container */
	className?: string;
	/** Optional ArkType runtime schema definition for prop validation */
	schema?: object;
}
