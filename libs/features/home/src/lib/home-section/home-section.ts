import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioContent } from '@portfolio/data';

/** The first screen: introduction, calls to action and social links. */
@Component({
  selector: 'mj-home-section',
  imports: [RouterLink],
  templateUrl: './home-section.html',
  styleUrl: './home-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSection {
  protected readonly hero = inject(PortfolioContent).hero;
}
