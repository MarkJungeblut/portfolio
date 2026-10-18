import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The legal notice at /impressum. Placeholder until the overlay is built. */
@Component({
  selector: 'mj-impressum-page',
  template: '<section id="impressum"></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpressumPage {}
