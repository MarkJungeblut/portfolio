import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  inject,
  Signal,
  signal,
} from '@angular/core';
import { activeSection } from '@portfolio/utils';

/** The line a section's top must reach to count as in view, from the top. */
const LINE = 0.35;

/**
 * Id of the section in view, among `ids` in page order. Starts at the first,
 * which is what the prerendered page shows; measured in the browser only,
 * after the first render, then once a frame while scrolling or resizing.
 * Must be called in an injection context.
 */
export function watchActiveSection(
  ids: readonly string[],
): Signal<string | null> {
  const active = signal<string | null>(ids[0] ?? null);
  const document = inject(DOCUMENT);
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => {
    const window = document.defaultView;
    if (!window) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const tops = ids.flatMap((id) => {
        const el = document.getElementById(id);
        return el ? [{ id, top: el.getBoundingClientRect().top }] : [];
      });
      active.set(activeSection(tops, window.innerHeight * LINE));
    };
    const schedule = () => {
      frame ||= window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(frame);
    });
  });

  return active.asReadonly();
}
