import { defineComponent, h, onMounted, onUnmounted, ref, watch, type PropType } from 'vue';
import { mount, unmount } from 'svelte';
import { createReactiveConduit } from '@arkane/core';
import type { SupportedVueHostTag } from './types.ts';

/**
 * Arkane Host for Vue 3.5.
 * Mounts a Svelte 5 component inside a layout-invisible container with deep attribute synchronization.
 */
export const Arkane = defineComponent({
  name: 'ArkaneVueHost',
  props: {
    this: {
      type: [Object, Function] as PropType<Parameters<typeof mount>[0]>,
      required: true,
    },
    as: {
      type: String as PropType<SupportedVueHostTag>,
      default: 'span',
    },
  },
  inheritAttrs: false,
  setup(props, { attrs }) {
    const containerRef = ref<HTMLElement | null>(null);
    const conduitRef = ref<ReturnType<typeof createReactiveConduit> | null>(null);
    let instance: Record<string, unknown> | null = null;

    onMounted(() => {
      if (!containerRef.value) return;

      const conduit = createReactiveConduit(attrs);
      conduitRef.value = conduit;

      instance = mount(props.this, {
        target: containerRef.value,
        props: conduit.proxy,
        intro: true,
      });
    });

    // Deep attribute synchronization without DOM remount
    watch(
      () => ({ ...attrs }),
      (newAttrs) => {
        if (conduitRef.value) {
          conduitRef.value.reconcile(newAttrs);
        }
      },
      { deep: true },
    );

    onUnmounted(() => {
      if (instance) {
        unmount(instance, { outro: true });
        instance = null;
      }
      if (conduitRef.value) {
        conduitRef.value.dispose();
        conduitRef.value = null;
      }
    });

    return () =>
      h(props.as, {
        ref: containerRef,
        style: { display: 'contents' },
      });
  },
});
