import React, { useEffect, useRef, useImperativeHandle } from 'react';
import { type Component, mount, unmount } from 'svelte';
import { createReactiveConduit } from '@arkane/core';
import type { ArkaneHostProps } from './types.ts';

/**
 * Arkane Host for React 19.
 * Mounts a Svelte 5 component inside a layout-invisible container with fine-grained reactivity.
 */
export function Arkane<C extends Component<Record<string, unknown>, Record<string, unknown>>>({
  this: SvelteComponent,
  as: Tag = 'span',
  className,
  ref,
  ...props
}: ArkaneHostProps<C>) {
  const containerRef = useRef<HTMLElement>(null);
  const conduitRef = useRef<ReturnType<typeof createReactiveConduit> | null>(null);

  // React 19 ref forwarding directly to container DOM node
  useImperativeHandle(ref, () => containerRef.current as HTMLElement);

  // 1. Mount and Teardown Lifecycle
  useEffect(() => {
    if (!containerRef.current) return;

    // Create Svelte 5 reactive proxy
    const conduit = createReactiveConduit(props);
    conduitRef.current = conduit;

    const instance = mount(SvelteComponent, {
      target: containerRef.current,
      props: conduit.proxy,
      intro: true,
    });

    return () => {
      unmount(instance, { outro: true });
      conduit.dispose();
      conduitRef.current = null;
    };
  }, [SvelteComponent]);

  // 2. Fine-grained Reactivity: Prop reconciliation on re-render without remounting
  useEffect(() => {
    if (conduitRef.current) {
      conduitRef.current.reconcile(props);
    }
  });

  return React.createElement(Tag, {
    ref: containerRef,
    className,
    style: { display: 'contents' },
  });
}
