import { describe, expect, it, vi } from 'vitest';
import { createPropValidator } from '../src/validation.ts';

describe('ArkType Prop Validator Guard', () => {
  it('passes valid properties against schema', () => {
    const validator = createPropValidator({
      'count?': 'number',
      title: 'string',
    });

    const isValid = validator({ count: 42, title: 'Valid' });
    expect(isValid).toBe(true);
  });

  it('catches invalid properties and logs diagnostic warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const validator = createPropValidator({
      count: 'number',
    });

    const isValid = validator({ count: 'not-a-number' });
    expect(isValid).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
