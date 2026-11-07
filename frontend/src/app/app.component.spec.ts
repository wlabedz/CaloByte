import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { appConfig } from './app.config';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: appConfig.providers,
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('links to the main views with hash URLs (GitHub Pages)', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const hrefs = Array.from(element.querySelectorAll('nav a'), (link) =>
      link.getAttribute('href'),
    );
    expect(hrefs).toEqual(['#/dashboard', '#/history', '#/recipes', '#/chat', '#/profile']);
  });

  it('switches the theme from the header', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.theme-toggle',
    );

    toggle?.click();
    await fixture.whenStable();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(toggle?.getAttribute('aria-label')).toBe('Włącz jasny motyw');
  });

  it('redirects unknown paths to the dashboard', async () => {
    await RouterTestingHarness.create('/nie-ma-takiej-strony');

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
