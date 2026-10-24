import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { PortfolioContent } from '@portfolio/data';
import { SectionHeading } from '@portfolio/ui';

/**
 * The legal notice at /impressum, as a modal over the page.
 *
 * The dialog is prerendered `open`, so the notice shows without JavaScript,
 * then upgraded to modal in the browser for the top layer, backdrop, focus
 * trap and Escape. Every way of closing ends in the dialog's `close` event,
 * which leaves the route.
 */
@Component({
  selector: 'mj-impressum-page',
  imports: [SectionHeading],
  templateUrl: './impressum-page.html',
  styleUrl: './impressum-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpressumPage {
  protected readonly impressum = inject(PortfolioContent).impressum;
  private readonly router = inject(Router);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterNextRender(() => {
      // showModal() throws on a dialog that is already open non-modally.
      const dialog = this.dialog().nativeElement;
      dialog.close();
      dialog.showModal();
    });
  }

  protected close(event: Event): void {
    event.preventDefault();
    this.dialog().nativeElement.close();
  }

  /** Clicks on the backdrop target the dialog; the panel covers the rest. */
  protected onDialogClick(event: MouseEvent): void {
    const dialog = this.dialog().nativeElement;
    if (event.target === dialog) dialog.close();
  }

  protected onClose(): void {
    // The upgrade's own close event arrives once the dialog is open again.
    if (this.dialog().nativeElement.open) return;
    void this.router.navigateByUrl('/');
  }
}
