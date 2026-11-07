import { DOCUMENT, DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

// Ten sam klucz czyta skrypt w index.html, który ustawia motyw jeszcze przed startem Angulara.
const STORAGE_KEY = 'calobyte.theme';

/**
 * Motyw aplikacji: domyślnie taki jak w systemie, a po użyciu przełącznika — wybrany przez
 * użytkownika i zapamiętany w przeglądarce. Kolory przełącza CSS (data-theme na <html>).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly darkQuery = this.document.defaultView?.matchMedia?.(
    '(prefers-color-scheme: dark)',
  );
  private readonly systemTheme = signal<Theme>(this.darkQuery?.matches ? 'dark' : 'light');
  private readonly chosen = signal<Theme | null>(readStoredTheme());

  readonly theme = computed(() => this.chosen() ?? this.systemTheme());

  constructor() {
    this.applyChosenTheme();

    const onSystemChange = (event: MediaQueryListEvent) =>
      this.systemTheme.set(event.matches ? 'dark' : 'light');
    this.darkQuery?.addEventListener('change', onSystemChange);
    inject(DestroyRef).onDestroy(() =>
      this.darkQuery?.removeEventListener('change', onSystemChange),
    );
  }

  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.chosen.set(next);
    this.applyChosenTheme();
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Zablokowany storage (np. tryb prywatny): wybór działa do odświeżenia strony.
    }
  }

  private applyChosenTheme(): void {
    const chosen = this.chosen();
    if (chosen) {
      this.document.documentElement.setAttribute('data-theme', chosen);
    } else {
      this.document.documentElement.removeAttribute('data-theme');
    }
  }
}

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}
