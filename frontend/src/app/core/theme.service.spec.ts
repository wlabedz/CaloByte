import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const root = document.documentElement;
  const view = document.defaultView as Window;

  function mockSystemTheme(dark: boolean): void {
    Object.defineProperty(view, 'matchMedia', {
      configurable: true,
      value: (media: string) => ({
        matches: dark,
        media,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
  }

  function cleanUp(): void {
    localStorage.clear();
    root.removeAttribute('data-theme');
    Reflect.deleteProperty(view, 'matchMedia');
  }

  beforeEach(cleanUp);
  afterEach(cleanUp);

  it('follows the system theme until the user picks one', () => {
    mockSystemTheme(true);

    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
    expect(root.hasAttribute('data-theme')).toBe(false);
  });

  it('switches to the opposite theme and remembers the choice', () => {
    mockSystemTheme(true);
    TestBed.inject(ThemeService).toggle();

    expect(root.getAttribute('data-theme')).toBe('light');

    TestBed.resetTestingModule();
    root.removeAttribute('data-theme');
    const reloaded = TestBed.inject(ThemeService);

    expect(reloaded.theme()).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('ignores an unknown stored value', () => {
    localStorage.setItem('calobyte.theme', 'purple');

    expect(TestBed.inject(ThemeService).theme()).toBe('light');
    expect(root.hasAttribute('data-theme')).toBe(false);
  });
});
