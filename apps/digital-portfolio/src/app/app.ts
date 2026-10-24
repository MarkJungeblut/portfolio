import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PortfolioContent } from '@portfolio/data';
import { HomeSection } from '@portfolio/features/home';
import { ProfileSection } from '@portfolio/features/profile';
import { Portrait, SiteHeader } from '@portfolio/ui';

@Component({
  imports: [RouterOutlet, SiteHeader, HomeSection, ProfileSection, Portrait],
  selector: 'mj-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly content = inject(PortfolioContent);
}
