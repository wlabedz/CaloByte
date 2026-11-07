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

  it('links to the main views with hash URLs (GitHub Pages)', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const hrefs = Array.from(element.querySelectorAll('nav a'), (link) =>
      link.getAttribute('href'),
    );
    expect(hrefs).toEqual(['#/dashboard', '#/history', '#/profile']);
  });

  it('redirects unknown paths to the dashboard', async () => {
    await RouterTestingHarness.create('/nie-ma-takiej-strony');

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
