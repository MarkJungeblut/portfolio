import { activeSection } from './active-section';

describe('activeSection', () => {
  const tops = (...values: number[]) =>
    ['home', 'profile', 'skills'].map((id, i) => ({ id, top: values[i] }));

  it('picks the first section while none has reached the line', () => {
    expect(activeSection(tops(100, 900, 1800), 50)).toBe('home');
  });

  it('picks the last section that has reached the line', () => {
    expect(activeSection(tops(-1200, -300, 400), 280)).toBe('profile');
  });

  it('counts a top exactly on the line as reached', () => {
    expect(activeSection(tops(-900, 280, 1100), 280)).toBe('profile');
  });

  it('picks the last section once all have passed', () => {
    expect(activeSection(tops(-2000, -1100, -200), 280)).toBe('skills');
  });

  it('returns null for no sections', () => {
    expect(activeSection([], 280)).toBeNull();
  });
});
