import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PortfolioContent } from '@portfolio/data';
import { SectionHeading } from '@portfolio/ui';

/** What Mark works with: a headline over four groups of skills. */
@Component({
  selector: 'mj-skills-section',
  imports: [SectionHeading],
  templateUrl: './skills-section.html',
  styleUrl: './skills-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsSection {
  protected readonly skills = inject(PortfolioContent).skills;
}
