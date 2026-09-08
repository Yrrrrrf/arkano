export type SupportedVueHostTag =
  | 'span'
  | 'div'
  | 'section'
  | 'article'
  | 'header'
  | 'footer'
  | 'main';

export interface ArkaneVueAdapterOptions {
  /** HTML host container tag. Defaults to 'span' with display: contents */
  as?: SupportedVueHostTag;
  /** Optional class name applied to container */
  className?: string;
}
