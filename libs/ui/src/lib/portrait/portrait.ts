import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The full-bleed portrait: the right-hand column when wide, the backdrop
 * behind the first screen when narrow. Images live in the app's
 * `public/images/`; the grayscale grade is baked into the files.
 */
@Component({
  selector: 'mj-portrait',
  templateUrl: './portrait.html',
  styleUrl: './portrait.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portrait {
  /** Describes the photo for screen readers. */
  readonly alt = input.required<string>();
}
