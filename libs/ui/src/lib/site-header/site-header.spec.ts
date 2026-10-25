import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SiteHeader } from './site-header';

/** Lets the dialog's queued `close` event settle. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

const { showModal, close } = HTMLDialogElement.prototype;

/** jsdom has no ResizeObserver; this one is triggered by hand. */
class FakeResizeObserver {
  static latest?: FakeResizeObserver;
  constructor(readonly callback: () => void) {
    FakeResizeObserver.latest = this;
  }
  observe(): void {
    // Sizes only change when a test says so.
  }
  disconnect(): void {
    // Nothing to release.
  }
}

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
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
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
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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

  describe('section in view', () => {
    const navs = () => [
      element.querySelector('nav[aria-label="Main"]')!,
      element.querySelector('nav[aria-label="Mobile"]')!,
    ];

    /** Names of the links marked current, per navigation. */
    const current = () =>
      navs().map((nav) =>
        links(nav)
          .filter(({ a }) => a.hasAttribute('aria-current'))
          .map(({ name, a }) => [name, a.getAttribute('aria-current')]),
      );

    const showSection = async (id: string | null) => {
      fixture.componentRef.setInput('activeSection', id);
      await fixture.whenStable();
    };

    it('marks no section current by default', () => {
      expect(current()).toEqual([[], []]);
    });

    it('marks the section in view as the current location in both navs', async () => {
      await showSection('skills');

      expect(current()).toEqual([
        [['Skills', 'location']],
        [['Skills', 'location']],
      ]);
    });

    it('moves the mark when another section comes into view', async () => {
      await showSection('skills');
      await showSection('profile');

      expect(current()).toEqual([
        [['Profile', 'location']],
        [['Profile', 'location']],
      ]);
    });

    it('marks only the Impressum while it is open', async () => {
      await showSection('skills');

      await TestBed.inject(Router).navigateByUrl('/impressum');
      await fixture.whenStable();

      expect(current()).toEqual([[['Impressum', 'page']], []]);
    });
  });

  describe('sliding indicator', () => {
    const nav = () =>
      element.querySelector<HTMLElement>('nav[aria-label="Main"]')!;

    /** Label boxes in the wide nav, which itself starts at x = 100. */
    let boxes: Record<string, Partial<DOMRect>>;

    const position = () => ({
      x: nav().style.getPropertyValue('--indicator-x'),
      y: nav().style.getPropertyValue('--indicator-y'),
      width: nav().style.getPropertyValue('--indicator-width'),
    });
    const sliding = () => nav().classList.contains('nav--sliding');
    const animated = () => nav().classList.contains('nav--animated');

    /** Queued animation frames, by id; cancelling one drops it. */
    let frames: Map<number, FrameRequestCallback>;
    /** Runs the queued animation frames. */
    const flushFrames = () => {
      const due = [...frames.values()];
      frames.clear();
      due.forEach((run) => run(0));
    };

    const showSection = async (id: string | null) => {
      fixture.componentRef.setInput('activeSection', id);
      await fixture.whenStable();
    };

    beforeEach(() => {
      frames = new Map();
      let lastFrame = 0;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((run) => {
        frames.set(++lastFrame, run);
        return lastFrame;
      });
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
        frames.delete(id);
      });
      boxes = {
        nav: { left: 100, top: 10, width: 600 },
        Profile: { left: 120, bottom: 40, width: 50 },
        Skills: { left: 200, bottom: 40, width: 40 },
        Impressum: { left: 400, bottom: 40, width: 80 },
      };
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
        function (this: Element) {
          const key = this.matches('nav') ? 'nav' : this.textContent!.trim();
          return {
            left: 0,
            top: 0,
            bottom: 0,
            width: 0,
            ...boxes[key],
          } as DOMRect;
        },
      );
    });

    it('sits on the current link’s rule', async () => {
      await showSection('skills');

      expect(position()).toEqual({ x: '100px', y: '29px', width: '40' });
      expect(sliding()).toBe(true);
    });

    it('appears in place, then slides from the next move on', async () => {
      await showSection('skills');

      expect(animated()).toBe(false);

      flushFrames();

      expect(animated()).toBe(true);
    });

    it('appears in place again after being hidden, e.g. narrow and back', async () => {
      await showSection('skills');
      flushFrames();
      await showSection(null);
      await showSection('profile');

      expect(animated()).toBe(false);
    });

    it('moves to the next current link', async () => {
      await showSection('skills');
      await showSection('profile');

      expect(position()).toEqual({ x: '20px', y: '29px', width: '50' });
    });

    it('moves to the Impressum while it is open', async () => {
      await showSection('skills');
      await TestBed.inject(Router).navigateByUrl('/impressum');
      await fixture.whenStable();

      expect(position()).toEqual({ x: '300px', y: '29px', width: '80' });
    });

    it('hides when no link is current', async () => {
      await showSection('skills');
      await showSection(null);

      expect(sliding()).toBe(false);
    });

    it('stays hidden while the nav is, on narrow screens', async () => {
      boxes['nav'] = { ...boxes['nav'], width: 0 };
      await showSection('skills');

      expect(sliding()).toBe(false);
    });

    it('follows the links when the nav changes size', async () => {
      await showSection('skills');
      boxes['Skills'] = { left: 260, bottom: 40, width: 44 };
      FakeResizeObserver.latest!.callback();
      await fixture.whenStable();

      expect(position()).toEqual({ x: '160px', y: '29px', width: '44' });
    });

    it('slides when another link becomes current', async () => {
      await showSection('skills');
      flushFrames();
      await showSection('profile');

      expect(animated()).toBe(true);
    });

    it('slides between a section and the Impressum', async () => {
      await showSection('skills');
      flushFrames();
      await TestBed.inject(Router).navigateByUrl('/impressum');
      await fixture.whenStable();

      expect(position().x).toBe('300px');
      expect(animated()).toBe(true);
    });

    it('stays still once hidden, however often the link changed before', async () => {
      await showSection('skills');
      await showSection('profile');
      await showSection(null);
      flushFrames();

      // An orphaned frame from the first placement would turn motion on.
      expect(animated()).toBe(false);
    });

    it('snaps, not slides, when only the layout moves its link, e.g. a font swap', async () => {
      await showSection('skills');
      flushFrames();
      boxes['Skills'] = { left: 260, bottom: 40, width: 44 };
      FakeResizeObserver.latest!.callback();
      await fixture.whenStable();

      expect(animated()).toBe(false);

      flushFrames();

      expect(animated()).toBe(true);
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
