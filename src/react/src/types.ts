import type React from 'react';
import type { Component, ComponentProps } from 'svelte';

export type SupportedHostTag =
  | 'span'
  | 'div'
  | 'section'
  | 'article'
  | 'header'
  | 'footer'
  | 'main';

export type ArkaneHostProps<C extends Component<Record<string, unknown>, Record<string, unknown>>> =
  {
    /** The Svelte 5 component to mount */
    this: C;
    /** HTML host container tag. Defaults to 'span' with display: contents */
    as?: SupportedHostTag;
    /** Optional class name applied to the host container */
    className?: string;
    /** Direct React 19 ref forwarded to the container element */
    ref?: React.Ref<HTMLElement>;
  } & (ComponentProps<C> extends Record<string, unknown>
    ? ComponentProps<C>
    : Record<string, unknown>);

export interface ArkaneAdapterOptions {
  /** HTML container tag. Defaults to 'span' with display: contents */
  as?: SupportedHostTag;
  /** Optional default class name applied to container */
  className?: string;
  /** Optional ArkType runtime schema definition for development prop validation */
  schema?: object;
}
