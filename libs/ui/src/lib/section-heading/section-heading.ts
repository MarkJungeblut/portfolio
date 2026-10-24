import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A section's eyebrow label and `h2`. The section labels itself by the
 * heading, so the id comes from the section that owns it.
 */
@Component({
  selector: 'mj-section-heading',
  templateUrl: './section-heading.html',
  styleUrl: './section-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeading {
  readonly eyebrow = input.required<string>();
  readonly heading = input.required<string>();
  /** Referenced by the owning section's `aria-labelledby`. */
  readonly headingId = input.required<string>();
}
