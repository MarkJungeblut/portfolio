import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { watchActiveSection } from './active-section';

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
  });
});
