import { Injectable } from '@angular/core';
import type { NavSection } from '@portfolio/utils';

/** A link to a page section, by its element id. */
export interface SectionLink {
  readonly label: string;
  readonly section: string;
}

/** A link off the site. */
export interface ExternalLink {
  readonly label: string;
  readonly url: string;
}

/** The first screen: who Mark is, and the ways onward. */
export interface HeroContent {
  readonly eyebrow: string;
  /** The heading reads "{name}", line break, "{rolePrefix} {role}". */
  readonly name: string;
  readonly rolePrefix: string;
  readonly role: string;
  readonly lede: string;
  readonly primaryCta: SectionLink;
  readonly secondaryCta: SectionLink;
  readonly socials: readonly ExternalLink[];
  readonly mail: SectionLink;
  readonly scrollCue: SectionLink;
}

/** Page sections in display order. */
const SECTIONS: readonly NavSection[] = [
  { id: 'home', label: 'Home' },
  { id: 'profile', label: 'Profile' },
  { id: 'skills', label: 'Skills' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'contact', label: 'Contact' },
];

const HERO: HeroContent = {
  eyebrow: 'Portfolio 2026',
  name: 'I am Mark Jungeblut',
  rolePrefix: 'and I am a',
  role: 'Software Architect',
  lede: 'I design systems end to end, from data model to interface, built robust and scalable enough to survive whatever the future ships next.',
  primaryCta: { label: 'Get to Know Me', section: 'profile' },
  secondaryCta: { label: 'See the work', section: 'portfolio' },
  socials: [
    { label: 'GitHub', url: 'https://github.com/MarkJungeblut' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/mark-jungeblut/' },
  ],
  mail: { label: 'Mail', section: 'contact' },
  scrollCue: { label: 'Scroll', section: 'profile' },
};

@Injectable({ providedIn: 'root' })
export class PortfolioContent {
  readonly sections = SECTIONS;
  readonly hero = HERO;
}
