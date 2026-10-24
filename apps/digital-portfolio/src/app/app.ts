import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PortfolioContent } from '@portfolio/data';
import { HomeSection } from '@portfolio/features/home';
import { PortfolioSection } from '@portfolio/features/portfolio';
import { ProfileSection } from '@portfolio/features/profile';
import { SkillsSection } from '@portfolio/features/skills';
import { Portrait, SiteHeader } from '@portfolio/ui';

@Component({
  imports: [
    RouterOutlet,
    SiteHeader,
    HomeSection,
    ProfileSection,
    SkillsSection,
    PortfolioSection,
    Portrait,
  ],
  selector: 'mj-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly content = inject(PortfolioContent);
}
