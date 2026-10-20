import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PortfolioContent } from '@portfolio/data';
import { Portrait, SiteHeader } from '@portfolio/ui';

@Component({
  imports: [RouterOutlet, SiteHeader, Portrait],
  selector: 'mj-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly content = inject(PortfolioContent);
}
