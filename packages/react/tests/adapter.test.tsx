import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { arkane, toReact } from '../src/adapter.svelte.ts';
// @ts-expect-error - Svelte fixture import
import Counter from '../../../fixtures/components/Counter.svelte';

describe('React 19 arkane() / toReact() HOC', () => {
  it('creates an idiomatic React component with displayName', () => {
    const ReactCounter = arkane(Counter);
    expect(ReactCounter.displayName).toContain('arkane(');

    render(<ReactCounter initial={42} />);
    expect(screen.getByText('42')).not.toBeNull();
  });

  it('toReact alias works identically', () => {
    const ReactCounter = toReact(Counter);
    render(<ReactCounter initial={100} />);
    expect(screen.getByText('100')).not.toBeNull();
  });
});
