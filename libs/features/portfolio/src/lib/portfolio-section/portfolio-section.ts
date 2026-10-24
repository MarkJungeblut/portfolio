import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PortfolioContent } from '@portfolio/data';
import { PageSection, SectionHeading } from '@portfolio/ui';

/** Where Mark has worked: his positions, newest first, and a side role. */
@Component({
  selector: 'mj-portfolio-section',
  imports: [PageSection, SectionHeading],
  templateUrl: './portfolio-section.html',
  styleUrl: './portfolio-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioSection {
  protected readonly portfolio = inject(PortfolioContent).portfolio;
}
