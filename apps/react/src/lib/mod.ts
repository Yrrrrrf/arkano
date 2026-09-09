import { Counter as SvelteCounter, Icon as SvelteIcon } from "@sdk/ui";
import { Arkane, Svelte, toReact } from "@arkane/react";
import faviconUrl from "./assets/img/react.svg";

export { Arkane, Svelte, toReact };
export const Counter = toReact(SvelteCounter);
export const Icon = toReact(SvelteIcon);
export { faviconUrl };
export default faviconUrl;
