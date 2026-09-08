import { describe, expect, it } from 'vitest';
import { mount as mountVue } from '@vue/test-utils';
import { ref } from 'vue';
import { Arkane } from '../src/host.svelte.ts';
// @ts-expect-error - Svelte fixture import
import Counter from '../../../fixtures/components/Counter.svelte';

describe('Vue 3.5 <Arkane /> Host', () => {
  it('renders with layout-invisible display: contents container', () => {
    const wrapper = mountVue(Arkane, {
      props: {
        this: Counter,
        as: 'span',
      },
      attrs: {
        initial: 0,
      },
    });

    const hostSpan = wrapper.find('span');
    expect(hostSpan.exists()).toBe(true);
    expect(hostSpan.attributes('style')).toContain('display: contents');
  });

  it('updates props fine-grained via deep watcher without remounting', async () => {
    const count = ref(1);
    const wrapper = mountVue({
      components: { Arkane },
      setup() {
        return { Counter, count };
      },
      template: '<Arkane :this="Counter" :count="count" />',
    });

    expect(wrapper.text()).toContain('1');

    // Mutate reactive Vue ref
    count.value = 5;
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('5');
  });

  it('unmounts cleanly and invokes Svelte unmount', () => {
    const wrapper = mountVue(Arkane, {
      props: {
        this: Counter,
      },
    });
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
    expect(wrapper.element.parentElement).toBeNull();
  });
});
