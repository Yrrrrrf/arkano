import { Counter as SvelteCounter, Icon as SvelteIcon } from "@sdk/ui";
import { Arkane, Svelte, toVue } from "@arkane/vue";
import faviconUrl from "./assets/img/vue.svg";

export { Arkane, Svelte, toVue };
export const Counter = toVue(SvelteCounter);
export const Icon = toVue(SvelteIcon);
export { faviconUrl };
export default faviconUrl;
