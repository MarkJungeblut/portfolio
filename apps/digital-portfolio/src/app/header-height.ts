/**
 * Height of the fixed header in px, from the `--header-height` token. Anchor
 * scrolls offset by it: the router scrolls with `window.scrollTo`, which
 * ignores CSS `scroll-padding-top`. Read on every scroll, since the token
 * changes at the wide breakpoint.
 */
export function headerHeight(document: Document): number {
  const height = getComputedStyle(document.documentElement).getPropertyValue(
    '--header-height',
  );
  return parseFloat(height) || 0;
}
