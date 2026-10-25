import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ANCHOR_SCROLL_QUIET_MS, watchActiveSection } from './active-section';

@Component({
  template: `
    <section id="home"></section>
    <section id="profile"></section>
    <section id="skills"></section>
  `,
})
class Host {
  readonly active = watchActiveSection(['home', 'profile', 'skills']);
}

describe('watchActiveSection', () => {
  let fixture: ComponentFixture<Host>;
  let frames: FrameRequestCallback[];
  let measure: ReturnType<typeof vi.spyOn>;
  const tops: Record<string, number> = {};

  /** Places each section's top, in px from the viewport top. */
  const layout = (home: number, profile: number, skills: number) =>
    Object.assign(tops, { home, profile, skills });

  /** Runs the queued animation frames. */
  const flushFrames = () => frames.splice(0).forEach((run) => run(0));

  const scroll = () => {
    window.dispatchEvent(new Event('scroll'));
    flushFrames();
  };

  beforeEach(async () => {
    frames = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((run) =>
      frames.push(run),
    );
    vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
    // The line sits at 35% of 800px: 280px.
    measure = vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: Element) {
        return { top: tops[this.id] ?? 0 } as DOMRect;
      });
    layout(0, 800, 1600);
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }])],
    });
    fixture = TestBed.createComponent(Host);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const active = () => fixture.componentInstance.active();

  /** Renders the host, then forgets the measurements made doing so. */
  const render = async () => {
    await fixture.whenStable();
    flushFrames();
    measure.mockClear();
  };

  it('starts at the first section before measuring, as prerendered', () => {
    layout(-1700, -900, -100);

    expect(active()).toBe('home');
  });

  it('measures once rendered, e.g. after a reload scrolled to a section', async () => {
    layout(-1700, -900, -100);
    await render();

    expect(active()).toBe('skills');
  });

  describe('once rendered', () => {
    beforeEach(render);

    it('follows the section whose top passed the line while scrolling', () => {
      layout(-1000, -200, 600);
      scroll();

      expect(active()).toBe('profile');
    });

    it('measures once a frame, however many scroll events arrive', () => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
      flushFrames();

      // One measurement reads each of the three sections once.
      expect(measure).toHaveBeenCalledTimes(3);
    });

    it('remeasures on resize', () => {
      layout(-1700, -900, -100);
      window.dispatchEvent(new Event('resize'));
      flushFrames();

      expect(active()).toBe('skills');
    });

    it('stops listening once destroyed', () => {
      fixture.destroy();
      scroll();

      expect(measure).not.toHaveBeenCalled();
    });

    describe('following a link to a section', () => {
      const follow = (url: string) => TestBed.inject(Router).navigateByUrl(url);
      /** Lets `ms` of scroll-free time pass. */
      const wait = (ms: number) => vi.advanceTimersByTime(ms);

      beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('marks the target at once', async () => {
        await follow('/#skills');

        expect(active()).toBe('skills');
      });

      it('skips the sections scrolled past on the way', async () => {
        await follow('/#skills');
        layout(-1000, -200, 600);
        scroll();

        expect(active()).toBe('skills');
      });

      it('follows the scroll again once it has gone quiet', async () => {
        await follow('/#skills');
        layout(-1000, -200, 600);
        scroll();
        wait(ANCHOR_SCROLL_QUIET_MS);

        expect(active()).toBe('profile');
      });

      it('keeps holding while the scroll goes on', async () => {
        await follow('/#skills');
        wait(ANCHOR_SCROLL_QUIET_MS - 1);
        layout(-1000, -200, 600);
        scroll();
        wait(ANCHOR_SCROLL_QUIET_MS - 1);

        expect(active()).toBe('skills');

        wait(1);

        expect(active()).toBe('profile');
      });

      it('holds again on a repeat click of the link in the URL', async () => {
        await follow('/#skills');
        wait(ANCHOR_SCROLL_QUIET_MS);
        expect(active()).toBe('home');

        await follow('/#skills');
        layout(-1000, -200, 600);
        scroll();

        expect(active()).toBe('skills');
      });

      it('ignores a fragment that is not a section', async () => {
        await follow('/#main');
        layout(-1000, -200, 600);
        scroll();

        expect(active()).toBe('profile');
      });

      it('drops a pending hold once destroyed', async () => {
        await follow('/#skills');
        fixture.destroy();
        wait(ANCHOR_SCROLL_QUIET_MS);

        // A stray measurement would find no sections left and clear it.
        expect(active()).toBe('skills');
      });
    });
  });
});
