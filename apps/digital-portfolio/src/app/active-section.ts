import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  inject,
  Signal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  NavigationSkipped,
  NavigationSkippedCode,
  Router,
} from '@angular/router';
import { activeSection } from '@portfolio/utils';
import { filter, map } from 'rxjs';

/** The line a section's top must reach to count as in view, from the top. */
const LINE = 0.35;

/**
 * Scroll-free time, in ms, after which an anchor scroll, or the page settling
 * after load, counts as done.
 */
export const ANCHOR_SCROLL_QUIET_MS = 150;

/**
 * Id of the section in view, among `ids` in page order. Starts at the first,
 * which is what the prerendered page marks for readers without JavaScript.
 * In the browser it is `null` from hydration until the page has settled
 * (the initial anchor scroll or a restored scroll position), then measured
 * once a frame while scrolling or resizing.
 *
 * Following a link to a section marks it at once and holds it until the
 * anchor scroll has gone quiet, so the sections scrolled past on the way
 * are never marked. Must be called in an injection context.
 */
export function watchActiveSection(
  ids: readonly string[],
): Signal<string | null> {
  const active = signal<string | null>(ids[0] ?? null);
  const document = inject(DOCUMENT);
  const router = inject(Router);
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => {
    const window = document.defaultView;
    if (!window) return;
    let frame = 0;
    /** Pending end of an anchor scroll; set while one is in progress. */
    let release: ReturnType<typeof window.setTimeout> | undefined;

    const measure = () => {
      frame = 0;
      const tops = ids.flatMap((id) => {
        const el = document.getElementById(id);
        return el ? [{ id, top: el.getBoundingClientRect().top }] : [];
      });
      active.set(activeSection(tops, window.innerHeight * LINE));
    };
    // Starts, or restarts, the quiet period that ends an anchor scroll.
    const holdUntilQuiet = () => {
      window.clearTimeout(release);
      release = window.setTimeout(() => {
        release = undefined;
        measure();
      }, ANCHOR_SCROLL_QUIET_MS);
    };
    const schedule = () => {
      if (release !== undefined) holdUntilQuiet();
      else frame ||= window.requestAnimationFrame(measure);
    };

    // Every navigation the router follows with an anchor scroll, including
    // a repeat click on the link already in the URL, which it skips.
    router.events
      .pipe(
        map((event) =>
          event instanceof NavigationEnd
            ? event.urlAfterRedirects
            : event instanceof NavigationSkipped &&
                event.code === NavigationSkippedCode.IgnoredSameUrlNavigation
              ? event.url
              : null,
        ),
        filter((url) => url !== null),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((url) => {
        const target = router.parseUrl(url).fragment;
        if (target === null || !ids.includes(target)) return;
        window.cancelAnimationFrame(frame);
        frame = 0;
        active.set(target);
        holdUntilQuiet();
      });

    // Marking the first section now would mean jumping away from it once
    // the load's own scroll lands; mark nothing until it has.
    active.set(null);
    holdUntilQuiet();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(release);
    });
  });

  return active.asReadonly();
}
