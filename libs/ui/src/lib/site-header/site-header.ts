import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { ExternalLink, NavSection } from '@portfolio/utils';

/**
 * Fixed top bar: skip link, logo, section navigation and the menu toggle.
 *
 * Narrow screens get the navigation as a full-screen menu, a modal dialog
 * for the top layer, inert page, focus trap and Escape. Every way of closing
 * ends in the dialog's `close` event, which resets the toggle.
 */
@Component({
  selector: 'mj-site-header',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  /** In-page sections, in display order. */
  readonly sections = input.required<readonly NavSection[]>();
  /** Off-site profiles, listed in the mobile menu. */
  readonly socials = input.required<readonly ExternalLink[]>();

  protected readonly menuOpen = signal(false);
  private readonly menu =
    viewChild.required<ElementRef<HTMLDialogElement>>('menu');

  /** Two-digit position of a menu item, e.g. "01". */
  protected itemNumber(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected openMenu(): void {
    this.menu().nativeElement.showModal();
    this.menuOpen.set(true);
  }

  /** Links close the menu before their navigation runs. */
  protected closeMenu(): void {
    this.menu().nativeElement.close();
  }

  protected onMenuClose(): void {
    this.menuOpen.set(false);
  }
}
