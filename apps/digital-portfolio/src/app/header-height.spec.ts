import { headerHeight } from './header-height';

describe('headerHeight', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--header-height');
  });

  it('returns the header height token in px', () => {
    document.documentElement.style.setProperty('--header-height', '68px');

    expect(headerHeight(document)).toBe(68);
  });

  it('reads the token afresh on every call', () => {
    document.documentElement.style.setProperty('--header-height', '68px');
    headerHeight(document);
    document.documentElement.style.setProperty('--header-height', '104px');

    expect(headerHeight(document)).toBe(104);
  });

  it('falls back to 0 when the token is missing', () => {
    expect(headerHeight(document)).toBe(0);
  });
});
