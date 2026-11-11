import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

import { ActiveUserService } from '../../core/active-user.service';
import { ChatStore } from '../../core/chat-store.service';
import { ChatThreadComponent } from '../../features/chat/chat-thread/chat-thread.component';

/**
 * Pływający przycisk czatu w prawym dolnym rogu: otwiera okienko z tą samą rozmową co
 * widok `/chat`. Widoczny po zalogowaniu na każdej stronie poza samym czatem.
 */
@Component({
  selector: 'app-chat-widget',
  imports: [ChatThreadComponent, RouterLink],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
})
export class ChatWidgetComponent {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly activeUser = inject(ActiveUserService);
  protected readonly chat = inject(ChatStore);

  protected readonly open = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly visible = computed(
    () => this.activeUser.user() !== null && !this.url().startsWith('/chat'),
  );

  private readonly thread = viewChild(ChatThreadComponent);
  private readonly toggleButton = viewChild<ElementRef<HTMLButtonElement>>('fabButton');

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    // Pole wiadomości istnieje dopiero po wyrenderowaniu okienka.
    afterNextRender(() => this.thread()?.focus(), { injector: this.injector });
  }

  protected close(): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.toggleButton()?.nativeElement.focus();
  }
}
