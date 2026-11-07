import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly navLinks = [
    { path: '/dashboard', label: 'Pulpit' },
    { path: '/history', label: 'Historia' },
    { path: '/profile', label: 'Profil' },
  ];

  protected readonly theme = inject(ThemeService);
  protected readonly themeToggleLabel = computed(() =>
    this.theme.theme() === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw',
  );
}
