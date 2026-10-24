import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { MockInstance } from 'vitest';
import { ImpressumPage } from './impressum-page';

/** Lets the dialog's queued `close` event fire. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

describe('ImpressumPage', () => {
  let fixture: ComponentFixture<ImpressumPage>;
  let element: HTMLElement;
  let dialog: HTMLDialogElement;
  let navigate: MockInstance<Router['navigateByUrl']>;
  let showModal: MockInstance<HTMLDialogElement['showModal']>;

  beforeEach(async () => {
    // jsdom has no dialog behaviour. Mimic the browser: close() fires its
    // close event as a queued task, and only when the dialog was open.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      if (!this.open) return;
      this.removeAttribute('open');
      setTimeout(() => this.dispatchEvent(new Event('close')));
    };
    showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');

    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);

    fixture = TestBed.createComponent(ImpressumPage);
    await fixture.whenStable();
    element = fixture.nativeElement;
    dialog = element.querySelector('dialog')!;
    await nextTask();
  });

  const closeLink = () =>
    Array.from(element.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Close'),
    )!;

  it('renders a dialog named by its heading', () => {
    const labelledBy = dialog.getAttribute('aria-labelledby')!;

    expect(element.querySelector(`#${labelledBy}`)?.textContent).toBe(
      'Angaben gemäß § 5 DDG',
    );
  });

  it('shows the responsible person, contact and disclaimer', () => {
    const text = dialog.textContent!;

    expect(text).toContain('Mark Jungeblut');
    expect(text).toContain('Tannenkampstraße 27');
    expect(text).toContain('26160 Bad Zwischenahn');
    expect(text).toContain('Haftungsausschluss');
    expect(text).toContain('keine Gewähr übernommen');
    const mail = Array.from(element.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'mark.jungeblut@gmail.com',
    );
    expect(mail?.getAttribute('href')).toBe('mailto:mark.jungeblut@gmail.com');
  });

  it('opens as a modal once rendered', () => {
    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
  });

  it('does not leave the route for the upgrade to modal', () => {
    expect(navigate).not.toHaveBeenCalled();
  });

  it('closes to the home page from the Close link', async () => {
    expect(closeLink().getAttribute('href')).toBe('/');

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    closeLink().dispatchEvent(click);
    await nextTask();

    expect(click.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('closes on a backdrop click', async () => {
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTask();

    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('stays open on a click inside the panel', async () => {
    element
      .querySelector('dd')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTask();

    expect(dialog.open).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('leaves the route when the browser closes it, e.g. on Escape', async () => {
    dialog.close();
    await nextTask();

    expect(navigate).toHaveBeenCalledWith('/');
  });
});
