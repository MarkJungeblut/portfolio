import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SiteHeader } from './site-header';

/** Lets the dialog's queued `close` event settle. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

const { showModal, close } = HTMLDialogElement.prototype;

/** Text a screen reader announces: content minus `aria-hidden` parts. */
const accessibleName = (el: Element) => {
  const copy = el.cloneNode(true) as Element;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return copy.textContent?.replace(/\s+/g, ' ').trim();
};

describe('SiteHeader', () => {
  let fixture: ComponentFixture<SiteHeader>;
  let element: HTMLElement;

  beforeEach(async () => {
    // jsdom has no dialog behaviour. Mimic the browser: showModal() throws on
    // an open dialog (as older engines do), and close() fires its close event
    // as a queued task, only when the dialog was open.
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
      name: accessibleName(a),
      href: a.getAttribute('href'),
      a,
    }));

  const link = (scope: ParentNode, name: string) =>
    links(scope).find((l) => l.name === name)?.a;

  const button = (scope: ParentNode, name: string) =>
    Array.from(scope.querySelectorAll('button')).find(
      (b) => accessibleName(b) === name,
    )!;

  const menuButton = () => button(element.querySelector('header')!, 'Menu');
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
      expect(links(nav()).map(({ name, href }) => [name, href])).toEqual([
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

    it('focuses the menu itself, not its first link', async () => {
      await openMenu();

      expect(document.activeElement).toBe(menu());
    });

    it('ignores a second tap, e.g. two replayed from before hydration', async () => {
      const showModalSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
      await openMenu();

      menuButton().click();
      await fixture.whenStable();

      // A second showModal() on an open dialog throws in older browsers.
      expect(showModalSpy).toHaveBeenCalledOnce();
      expect(menu().open).toBe(true);
    });

    it('closes from its Close button', async () => {
      await openMenu();

      button(menu(), 'Close').click();
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

    it('lists the sections by name, in order, with fragment links', () => {
      const nav = menu().querySelector('nav[aria-label="Mobile"]')!;

      expect(links(nav).map(({ name, href }) => [name, href])).toEqual([
        ['Profile', '/#profile'],
        ['Skills', '/#skills'],
      ]);
    });

    it('numbers the sections visibly, from 01', () => {
      const nav = menu().querySelector('nav[aria-label="Mobile"]')!;
      const numbers = Array.from(nav.querySelectorAll('a')).map((a) =>
        a.querySelector('[aria-hidden="true"]')?.textContent?.trim(),
      );

      expect(numbers).toEqual(['01', '02']);
    });

    it('links to the impressum', () => {
      expect(link(menu(), 'Impressum')?.getAttribute('href')).toBe(
        '/impressum',
      );
    });

    it('links to the socials in a new tab', () => {
      const github = link(menu(), 'GitHub')!;

      expect(github.getAttribute('href')).toBe('https://github.com/example');
      expect(github.getAttribute('target')).toBe('_blank');
      expect(github.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it.each(['Skills', 'Impressum', 'GitHub'])(
      'closes when %s is followed',
      async (name) => {
        await openMenu();

        const target = link(menu(), name)!;
        // jsdom would try to open the social link's new tab.
        target.addEventListener('click', (e) => e.preventDefault());
        target.click();
        await settle();

        expect(menu().open).toBe(false);
        expect(menuButton().getAttribute('aria-expanded')).toBe('false');
      },
    );

    it('closes on any navigation, e.g. a swipe back', async () => {
      await openMenu();

      await TestBed.inject(Router).navigateByUrl('/impressum');
      await settle();

      expect(menu().open).toBe(false);
      expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    });
  });
});
