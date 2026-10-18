import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Fixed top bar: logo, section navigation and the mobile menu toggle. */
@Component({
  selector: 'mj-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  /** In-page sections, in display order. */
  readonly sections =
    input.required<readonly { id: string; label: string }[]>();
}
