import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  isActive,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs';
import type { ExternalLink, NavSection } from '@portfolio/utils';

/** Where the indicator sits under the current link, relative to the nav. */
interface IndicatorPosition {
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

/**
 * Fixed top bar: skip link, logo, section navigation and the menu toggle.
 *
 * Narrow screens get the navigation as a full-screen menu, a modal dialog
 * for the top layer, inert page, focus trap and Escape. Every way of closing
 * ends in the dialog's `close` event, which resets the toggle. Any
 * navigation closes it too, e.g. a swipe back on iOS, which leaves an open
 * dialog alone.
 *
 * The section in view is marked current in both navigations, except while
 * the Impressum is open: then only its link is. On wide screens one
 * indicator slides to whichever link is current; until the header can
 * measure, each link draws its own rule.
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
  /** Id of the section in view, if any. */
  readonly activeSection = input<string | null>(null);

  protected readonly menuOpen = signal(false);
  private readonly menu =
    viewChild.required<ElementRef<HTMLDialogElement>>('menu');
  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  /** Bumped whenever the nav changes size: breakpoint, font swap. */
  private readonly navResized = signal(0);

  private readonly router = inject(Router);
  private readonly onImpressum = isActive('/impressum', this.router, {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  });
  /** Id of the section whose links are marked current. */
  protected readonly currentSection = computed(() =>
    this.onImpressum() ? null : this.activeSection(),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenu());

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new ResizeObserver(() =>
        this.navResized.update((n) => n + 1),
      );
      observer.observe(this.nav().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });

    afterRenderEffect({
      earlyRead: () => {
        // Whatever moves aria-current, or the links, moves the indicator.
        this.currentSection();
        this.navResized();
        return this.indicatorPosition();
      },
      write: (position) => this.placeIndicator(position()),
    });
  }

  /** Under the current link's label, or `null`: none, or the nav hidden. */
  private indicatorPosition(): IndicatorPosition | null {
    const nav = this.nav().nativeElement;
    const label = nav.querySelector('[aria-current] > .nav-label');
    const box = nav.getBoundingClientRect();
    if (!label || box.width === 0) return null;
    const rect = label.getBoundingClientRect();
    return {
      x: rect.left - box.left,
      // On the label's bottom border, where its own rule would be.
      y: rect.bottom - box.top - 1,
      width: rect.width,
    };
  }

  private placeIndicator(position: IndicatorPosition | null): void {
    const nav = this.nav().nativeElement;
    if (!position) {
      nav.classList.remove('nav--sliding');
      return;
    }
    nav.style.setProperty('--indicator-x', `${position.x}px`);
    nav.style.setProperty('--indicator-y', `${position.y}px`);
    nav.style.setProperty('--indicator-width', `${position.width}`);
    if (nav.classList.contains('nav--sliding')) return;
    nav.classList.add('nav--sliding');
    // Animate from the next move on: the first placement appears in place.
    requestAnimationFrame(() => nav.classList.add('nav--animated'));
  }

  /** Two-digit position of a menu item, e.g. "01". */
  protected itemNumber(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected openMenu(): void {
    const menu = this.menu().nativeElement;
    // A second tap replayed from before hydration finds it open, and older
    // browsers throw on showModal() for an open dialog.
    if (menu.open) return;
    menu.showModal();
    // Start on the menu, not its first link: Safari rings that link even
    // after a tap. Tab still reaches it, with its ring.
    menu.focus();
    this.menuOpen.set(true);
  }

  /** Links close the menu before their navigation runs. */
  protected closeMenu(): void {
    const menu = this.menu().nativeElement;
    if (menu.open) menu.close();
  }

  protected onMenuClose(): void {
    this.menuOpen.set(false);
  }
}
