/** A section of the one-page site, reachable as an in-page anchor. */
export interface NavSection {
  /** Element id of the section, used as the URL fragment. */
  readonly id: string;
  readonly label: string;
}
