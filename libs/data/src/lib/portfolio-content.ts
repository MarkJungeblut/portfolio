import { Injectable } from '@angular/core';

/** A section of the one-page site, reachable as an in-page anchor. */
export interface NavSection {
  /** Element id of the section, used as the URL fragment. */
  readonly id: string;
  readonly label: string;
}

/** Page sections in display order. */
const SECTIONS: readonly NavSection[] = [
  { id: 'home', label: 'Home' },
  { id: 'profile', label: 'Profile' },
  { id: 'skills', label: 'Skills' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'contact', label: 'Contact' },
];

@Injectable({ providedIn: 'root' })
export class PortfolioContent {
  readonly sections = SECTIONS;
}
