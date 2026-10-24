import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteHeader } from './site-header';

/** Lets the dialog's queued `close` event settle. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

const { showModal, close } = HTMLDialogElement.prototype;

describe('SiteHeader', () => {
  let fixture: ComponentFixture<SiteHeader>;
  let element: HTMLElement;

  beforeEach(async () => {
    // jsdom has no dialog behaviour. Mimic the browser: close() fires its
    // close event as a queued task, only when the dialog was open.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      if (!this.open) return;
      this.removeAttribute('open');
      setTimeout(() => this.dispatchEvent(new Event('close')));
    };

    await TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteHeader);
    fixture.componentRef.setInput('sections', [
      { id: 'profile', label: 'Profile' },
      { id: 'skills', label: 'Skills' },
    ]);
    fixture.componentRef.setInput('socials', [
      { label: 'GitHub', url: 'https://github.com/example' },
    ]);
    await fixture.whenStable();
    element = fixture.nativeElement;
  });

  afterEach(() => {
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;
  });

  const links = (scope: ParentNode) =>
    Array.from(scope.querySelectorAll('a')).map((a) => ({
      text: a.textContent?.replace(/\s+/g, ' ').trim(),
      href: a.getAttribute('href'),
      a,
    }));

  const link = (scope: ParentNode, name: string) =>
    links(scope).find((l) => l.text === name)?.a;

  const menuButton = () =>
    element.querySelector<HTMLButtonElement>('button[aria-controls]')!;
  const menu = () => element.querySelector('dialog')!;

  const openMenu = async () => {
    menuButton().click();
    await fixture.whenStable();
  };

  /** Lets the close event fire and the view update. */
  const settle = async () => {
    await nextTask();
    await fixture.whenStable();
  };

  describe('header', () => {
    const nav = () => element.querySelector('nav[aria-label="Main"]')!;

    it('renders a fragment link per section, in order', () => {
      expect(links(nav()).map(({ text, href }) => [text, href])).toEqual([
        ['Profile', '/#profile'],
        ['Skills', '/#skills'],
        ['Impressum', '/impressum'],
      ]);
    });

    it('offers a skip link to the main content', () => {
      expect(link(element, 'Skip to content')?.getAttribute('href')).toBe(
        '#main',
      );
    });
  });

  describe('mobile menu', () => {
    it('starts closed', () => {
      expect(menu().open).toBe(false);
      expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    });

    it('opens from the Menu button', async () => {
      await openMenu();

      expect(menu().open).toBe(true);
      expect(menuButton().getAttribute('aria-expanded')).toBe('true');
    });

    it('closes from its Close button', async () => {
      await openMenu();
      const closeButton = Array.from(menu().querySelectorAll('button')).find(
        (b) => b.textContent?.replace(/\s+/g, ' ').trim() === 'Close ×',
      )!;

      closeButton.click();
      await settle();

      expect(menu().open).toBe(false);
      expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    });

    it('resets the toggle when the browser closes it, e.g. on Escape', async () => {
      await openMenu();

      menu().close();
      await settle();

      expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    });

    it('lists the sections numbered, in order', () => {
      const nav = menu().querySelector('nav[aria-label="Mobile"]')!;

      expect(links(nav).map(({ text, href }) => [text, href])).toEqual([
        ['01Profile', '/#profile'],
        ['02Skills', '/#skills'],
      ]);
    });

    it('links to the impressum and the socials', () => {
      const github = link(menu(), 'GitHub')!;

      expect(link(menu(), 'Impressum')?.getAttribute('href')).toBe(
        '/impressum',
      );
      expect(github.getAttribute('href')).toBe('https://github.com/example');
      expect(github.getAttribute('target')).toBe('_blank');
    });

    it.each(['02Skills', 'Impressum'])(
      'closes when %s is followed',
      async (name) => {
        await openMenu();

        link(menu(), name)!.click();
        await settle();

        expect(menu().open).toBe(false);
        expect(menuButton().getAttribute('aria-expanded')).toBe('false');
      },
    );
  });
});
