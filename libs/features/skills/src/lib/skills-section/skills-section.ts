import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PortfolioContent } from '@portfolio/data';
import { PageSection, SectionHeading } from '@portfolio/ui';

/** What Mark works with: a headline over four groups of skills. */
@Component({
  selector: 'mj-skills-section',
  imports: [PageSection, SectionHeading],
  templateUrl: './skills-section.html',
  styleUrl: './skills-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsSection {
  protected readonly skills = inject(PortfolioContent).skills;
}
