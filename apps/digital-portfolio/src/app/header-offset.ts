/**
 * Anchor-scroll offset clearing the fixed header. The router scrolls with
 * `window.scrollTo`, which ignores CSS `scroll-padding-top`, so the height
 * is read from the same `--header-height` token. Read on every scroll, since
 * the token changes at the wide breakpoint.
 */
export function headerOffset(document: Document): [number, number] {
  const height = getComputedStyle(document.documentElement).getPropertyValue(
    '--header-height',
  );
  return [0, parseFloat(height) || 0];
}
