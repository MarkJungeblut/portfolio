import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteHeader } from './site-header';

describe('SiteHeader', () => {
  let fixture: ComponentFixture<SiteHeader>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteHeader);
    fixture.componentRef.setInput('sections', [
      { id: 'profile', label: 'Profile' },
      { id: 'skills', label: 'Skills' },
    ]);
    await fixture.whenStable();
    element = fixture.nativeElement;
  });

  const link = (name: string) =>
    Array.from(element.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === name,
    );

  it('renders a fragment link per section, in order', () => {
    const nav = element.querySelector('nav')!;
    const labels = Array.from(nav.querySelectorAll('a')).map((a) =>
      a.textContent?.trim(),
    );

    expect(labels).toEqual(['Profile', 'Skills', 'Impressum']);
    expect(link('Profile')?.getAttribute('href')).toBe('/#profile');
    expect(link('Skills')?.getAttribute('href')).toBe('/#skills');
  });

  it('links to the impressum route', () => {
    expect(link('Impressum')?.getAttribute('href')).toBe('/impressum');
  });

  it('offers a skip link to the main content', () => {
    expect(link('Skip to content')?.getAttribute('href')).toBe('#main');
  });

  it('toggles aria-expanded on the menu button', async () => {
    const button = element.querySelector<HTMLButtonElement>('button.menu')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
