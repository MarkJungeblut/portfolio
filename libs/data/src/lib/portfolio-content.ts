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

/** A link that opens the visitor's mail client. */
export interface MailLink {
  readonly label: string;
  readonly address: string;
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
  readonly mail: MailLink;
  readonly scrollCue: SectionLink;
}

/** A headline figure and what it counts. */
export interface Stat {
  readonly value: string;
  readonly label: string;
}

/** Who Mark is, in a sentence, a paragraph and three figures. */
export interface ProfileContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly lede: string;
  readonly stats: readonly Stat[];
}

/** A named group of skills, e.g. "Backend". */
export interface SkillGroup {
  readonly label: string;
  readonly items: readonly string[];
}

/** What Mark works with, in four groups. */
export interface SkillsContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly groups: readonly SkillGroup[];
}

/** One role in Mark's career, e.g. "2020 — 2025 · Lead Developer · AVIATAR". */
export interface Position {
  readonly period: string;
  readonly role: string;
  readonly organisation: string;
}

/** A side commitment shown under the positions. */
export interface Engagement {
  readonly period: string;
  readonly label: string;
}

/** Where Mark has worked, newest first. */
export interface PortfolioSectionContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly positions: readonly Position[];
  readonly engagement: Engagement;
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
  mail: { label: 'Mail', address: 'mark.jungeblut@gmail.com' },
  scrollCue: { label: 'Scroll', section: 'profile' },
};

const PROFILE: ProfileContent = {
  eyebrow: 'Profile',
  title:
    'More than a decade of turning tangled requirements into systems teams can actually run.',
  lede: 'I work across the whole stack — domain modelling, service boundaries, delivery pipelines, and the interface people finally touch. Most of my work starts as an audit and ends as an architecture that survives the next three roadmaps.',
  stats: [
    { value: '14+', label: 'Years shipping' },
    { value: '20', label: 'Developers in my org' },
    { value: 'Remote', label: 'Germany · Oldenburg' },
  ],
};

const SKILLS: SkillsContent = {
  eyebrow: 'Skills',
  title: 'The stack I reach for, and the parts I get called in to fix.',
  groups: [
    {
      label: 'Architecture',
      items: [
        'Architectural Transformation',
        'Domain Driven Design',
        'Event Driven Design',
        'Micro Service Architecture',
      ],
    },
    {
      label: 'Backend',
      items: [
        'C#',
        'ASP.NET',
        'Kotlin',
        'Spring Boot',
        'REST',
        'gRPC',
        'SQL',
        'Pub/Sub',
      ],
    },
    {
      label: 'Frontend',
      items: [
        'TypeScript',
        'Angular',
        'React',
        'Web Components',
        'Module Federation',
      ],
    },
    {
      label: 'Platform',
      items: [
        'Google Cloud Platform',
        'Azure',
        'GitHub',
        'Kubernetes',
        'Prometheus',
        'OpenTelemetry',
      ],
    },
  ],
};

const PORTFOLIO: PortfolioSectionContent = {
  eyebrow: 'Portfolio',
  title: 'Where I have been building',
  positions: [
    {
      period: 'Since 2026',
      role: 'Head of Backend Technologies',
      organisation: 'Lufthansa Industry Solutions',
    },
    {
      period: 'Since 2025',
      role: 'Solution Architect',
      organisation: 'Operation Decision Support Suite',
    },
    { period: '2020 — 2025', role: 'Lead Developer', organisation: 'AVIATAR' },
    {
      period: '2019 — 2020',
      role: 'Full Stack Developer',
      organisation: 'AVIATAR',
    },
    {
      period: '2015 — 2019',
      role: 'Fullstack Developer',
      organisation: 'Orgadata AG',
    },
    {
      period: '2012 — 2015',
      role: 'Apprenticeship',
      organisation: 'Orgadata AG',
    },
  ],
  engagement: { period: 'Since 2022', label: 'Volunteer IHK examiner' },
};

@Injectable({ providedIn: 'root' })
export class PortfolioContent {
  readonly sections = SECTIONS;
  readonly hero = HERO;
  readonly profile = PROFILE;
  readonly skills = SKILLS;
  readonly portfolio = PORTFOLIO;
}
