import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PortfolioContent } from '@portfolio/data';
import { PageSection, SectionHeading } from '@portfolio/ui';

/** Who Mark is: a headline, a short paragraph and three key figures. */
@Component({
  selector: 'mj-profile-section',
  imports: [PageSection, SectionHeading],
  templateUrl: './profile-section.html',
  styleUrl: './profile-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSection {
  protected readonly profile = inject(PortfolioContent).profile;
}
