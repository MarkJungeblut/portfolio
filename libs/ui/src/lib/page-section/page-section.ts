import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A page section's `<section>` element: the anchor target, focused after an
 * anchor scroll, labelled by its heading. The section's content, including
 * its width, is projected.
 */
@Component({
  selector: 'mj-page-section',
  templateUrl: './page-section.html',
  styleUrl: './page-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageSection {
  /** The section's element id, which anchor links target, e.g. `skills`. */
  readonly sectionId = input.required<string>();
  /** Id of the section's heading, for `aria-labelledby`. */
  readonly headingId = input.required<string>();
}
