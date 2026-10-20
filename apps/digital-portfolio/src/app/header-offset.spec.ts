import { headerOffset } from './header-offset';

describe('headerOffset', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--header-height');
  });

  it('returns the header height token as the vertical offset', () => {
    document.documentElement.style.setProperty('--header-height', '68px');

    expect(headerOffset(document)).toEqual([0, 68]);
  });

  it('reads the token afresh on every call', () => {
    document.documentElement.style.setProperty('--header-height', '68px');
    headerOffset(document);
    document.documentElement.style.setProperty('--header-height', '104px');

    expect(headerOffset(document)).toEqual([0, 104]);
  });

  it('falls back to no offset when the token is missing', () => {
    expect(headerOffset(document)).toEqual([0, 0]);
  });
});
