/** A section's id and the viewport offset of its top edge, in px. */
export interface SectionTop {
  readonly id: string;
  readonly top: number;
}

/**
 * Id of the section in view: the last one, in page order, whose top has
 * reached `line`. Before any has, the first section, so the top of the page
 * counts as the first section. `null` only for no sections.
 */
export function activeSection(
  tops: readonly SectionTop[],
  line: number,
): string | null {
  let active = tops[0]?.id ?? null;
  for (const { id, top } of tops) {
    if (top <= line) active = id;
  }
  return active;
}
