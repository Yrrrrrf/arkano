/**
 * Lookup table mapping React camelCase event handler prop names to standard
 * Svelte 5 / DOM lowercase callback attribute names.
 */
const EVENT_MAP: Record<string, string> = {
  onClick: 'onclick',
  onDoubleClick: 'ondblclick',
  onChange: 'onchange',
  onInput: 'oninput',
  onKeyDown: 'onkeydown',
  onKeyUp: 'onkeyup',
  onKeyPress: 'onkeypress',
  onMouseDown: 'onmousedown',
  onMouseUp: 'onmouseup',
  onMouseEnter: 'onmouseenter',
  onMouseLeave: 'onmouseleave',
  onMouseMove: 'onmousemove',
  onMouseOver: 'onmouseover',
  onMouseOut: 'onmouseout',
  onFocus: 'onfocus',
  onBlur: 'onblur',
  onSubmit: 'onsubmit',
  onReset: 'onreset',
  onScroll: 'onscroll',
  onWheel: 'onwheel',
  onTouchStart: 'ontouchstart',
  onTouchMove: 'ontouchmove',
  onTouchEnd: 'ontouchend',
  onTouchCancel: 'ontouchcancel',
  onPointerDown: 'onpointerdown',
  onPointerUp: 'onpointerup',
  onPointerMove: 'onpointermove',
  onPointerEnter: 'onpointerenter',
  onPointerLeave: 'onpointerleave',
  onPointerCancel: 'onpointercancel',
};

/**
 * Normalizes foreign event casing to Svelte 5 compatible lowercase attribute keys.
 * Handles both known DOM events and dynamic camelCase event props (e.g. `onSelect` -> `onselect`).
 */
export function normalizeEventName(reactEventName: string): string {
  if (EVENT_MAP[reactEventName]) {
    return EVENT_MAP[reactEventName];
  }
  if (
    reactEventName.startsWith('on') &&
    reactEventName.length > 2 &&
    reactEventName[2] === reactEventName[2].toUpperCase()
  ) {
    return `on${reactEventName.slice(2).toLowerCase()}`;
  }
  return reactEventName;
}
