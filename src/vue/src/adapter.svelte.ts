import { defineComponent, h } from 'vue';
import type { mount } from 'svelte';
import { Arkane } from './host.svelte.ts';
import type { ArkaneVueAdapterOptions } from './types.ts';

/**
 * Wraps a Svelte 5 component into a native Vue 3.5 component.
 */
export function arkane<C extends Parameters<typeof mount>[0]>(
  SvelteComponent: C,
  options?: ArkaneVueAdapterOptions,
) {
  const name = (SvelteComponent as { name?: string }).name || 'SvelteComponent';

  return defineComponent({
    name: `arkane(${name})`,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(
          Arkane,
          {
            this: SvelteComponent,
            as: options?.as ?? 'span',
            ...attrs,
          },
          slots,
        );
    },
  });
}

export { arkane as toVue };
