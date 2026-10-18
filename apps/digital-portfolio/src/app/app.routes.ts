import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  // The one-page site lives in the shell. Declared so `/` is prerendered.
  { path: '', pathMatch: 'full', children: [] },
  {
    path: 'impressum',
    loadComponent: () =>
      import('@portfolio/features/impressum').then((m) => m.ImpressumPage),
  },
];
