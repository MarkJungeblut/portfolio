import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { MockInstance } from 'vitest';
import { ImpressumPage } from './impressum-page';

/** Lets the dialog's queued `close` event and the navigation settle. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

const { showModal, close } = HTMLDialogElement.prototype;

describe('ImpressumPage', () => {
  let fixture: ComponentFixture<ImpressumPage>;
  let element: HTMLElement;
  let dialog: HTMLDialogElement;
  let router: Router;
  let showModalSpy: MockInstance<HTMLDialogElement['showModal']>;

  beforeEach(async () => {
    // jsdom has no dialog behaviour. Mimic the browser: showModal() throws on
    // a dialog already open non-modally, and close() fires its close event as
    // a queued task, only when the dialog was open.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      if (this.open)
        throw new DOMException('Already open', 'InvalidStateError');
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      if (!this.open) return;
      this.removeAttribute('open');
      setTimeout(() => this.dispatchEvent(new Event('close')));
    };
    showModalSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');

    await TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    router = TestBed.inject(Router);
    await router.navigateByUrl('/impressum');

    fixture = TestBed.createComponent(ImpressumPage);
    element = fixture.nativeElement;
    dialog = element.querySelector('dialog')!;
  });

  afterEach(() => {
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;
  });

  /** Renders, upgrades and lets the upgrade's close event fire. */
  const render = async () => {
    await fixture.whenStable();
    await nextTask();
  };

  const link = (name: string) =>
    Array.from(element.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === name,
    );

  /** A press and release, each on its own element, like a drag. */
  const press = (down: Element, up: Element = down) => {
    down.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    up.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  describe('once rendered', () => {
    beforeEach(render);

    it('renders a dialog named by its heading', () => {
      const labelledBy = dialog.getAttribute('aria-labelledby')!;

      expect(element.querySelector(`#${labelledBy}`)?.textContent).toBe(
        'Angaben gemäß § 5 DDG',
      );
    });

    it('shows the responsible person, contact and disclaimer', () => {
      const terms = Array.from(dialog.querySelectorAll('dt'));
      const detail = (term: string) =>
        terms
          .find((dt) => dt.textContent?.trim() === term)
          ?.nextElementSibling?.textContent?.replace(/\s+/g, ' ')
          .trim();

      expect(detail('Verantwortlich')).toBe(
        'Mark Jungeblut Tannenkampstraße 27 26160 Bad Zwischenahn Deutschland',
      );
      expect(detail('Kontakt')).toBe('E-Mail: mark.jungeblut@gmail.com');
      expect(link('mark.jungeblut@gmail.com')?.getAttribute('href')).toBe(
        'mailto:mark.jungeblut@gmail.com',
      );
      expect(detail('Haftungsausschluss')).toBe(
        'Diese Website dient ausschließlich privaten Zwecken und enthält ' +
          'keine kommerziellen Angebote. Alle Inhalte wurden mit größter ' +
          'Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und ' +
          'Aktualität der Inhalte wird keine Gewähr übernommen.',
      );
    });

    it('opens as a modal', () => {
      expect(showModalSpy).toHaveBeenCalledOnce();
      expect(dialog.open).toBe(true);
    });

    it('focuses the dialog itself, not its Close link', () => {
      expect(document.activeElement).toBe(dialog);
    });

    it('stays on the route through the upgrade to modal', () => {
      expect(router.url).toBe('/impressum');
    });

    it('closes to the home page from the Close link', async () => {
      const close = link('Close ×')!;
      expect(close.getAttribute('href')).toBe('/');

      const click = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      close.dispatchEvent(click);
      await nextTask();

      expect(click.defaultPrevented).toBe(true);
      expect(router.url).toBe('/');
    });

    it('closes on a backdrop click', async () => {
      press(dialog);
      await nextTask();

      expect(router.url).toBe('/');
    });

    it('stays open on a click inside the panel', async () => {
      press(element.querySelector('dd')!);
      await nextTask();

      expect(dialog.open).toBe(true);
      expect(router.url).toBe('/impressum');
    });

    it('stays open on a drag from the panel released over the backdrop', async () => {
      press(element.querySelector('dd')!, dialog);
      await nextTask();

      expect(dialog.open).toBe(true);
      expect(router.url).toBe('/impressum');
    });

    it('leaves the route when the browser closes it, e.g. on Escape', async () => {
      dialog.close();
      await nextTask();

      expect(router.url).toBe('/');
    });
  });

  it('does not reopen a dialog closed before the upgrade', async () => {
    // E.g. a click on Close made before hydration, replayed early.
    dialog.close();
    await render();

    expect(showModalSpy).not.toHaveBeenCalled();
    expect(dialog.open).toBe(false);
    expect(router.url).toBe('/');
  });
});
