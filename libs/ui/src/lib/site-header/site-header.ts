import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { NavSection } from '@portfolio/utils';

/** Fixed top bar: skip link, logo, section navigation and the menu toggle. */
@Component({
  selector: 'mj-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  /** In-page sections, in display order. */
  readonly sections = input.required<readonly NavSection[]>();

  /** Mobile menu state. The overlay it controls is not built yet. */
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }
}
