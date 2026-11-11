import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ChatStore } from '../../../core/chat-store.service';

let nextId = 0;

/**
 * Rozmowa z asystentem: podpowiedzi, wiadomości z kartami przepisów i pole wiadomości.
 * Używają go widok `/chat` i pływające okienko (`compact`: węższy układ).
 */
@Component({
  selector: 'app-chat-thread',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './chat-thread.component.html',
  styleUrl: './chat-thread.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.compact]': 'compact()' },
})
export class ChatThreadComponent {
  protected readonly chat = inject(ChatStore);

  readonly compact = input(false);

  /** Strona i okienko mogą być w DOM-ie naraz, więc id pola musi być unikalne. */
  protected readonly inputId = `chat-input-${nextId++}`;

  protected readonly suggestions = [
    'Ułóż mi jadłospis na 2000 kcal z dużą ilością białka',
    'Ile kcal powinien mieć obiad?',
    'Wegetariański obiad do 700 kcal',
  ];

  protected readonly form = new FormGroup({
    message: new FormControl('', { nonNullable: true }),
  });

  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('messageInput');
  private readonly end = viewChild<ElementRef<HTMLElement>>('end');

  constructor() {
    // Nowa wiadomość albo „pisze…” przewija rozmowę na dół (ważne w małym okienku).
    afterRenderEffect(() => {
      const started = this.chat.entries().length > 0;
      this.chat.loading();
      this.chat.errorMessage();
      if (started) {
        this.end()?.nativeElement.scrollIntoView?.({ block: 'end' });
      }
    });
  }

  focus(): void {
    this.input().nativeElement.focus();
  }

  protected send(text = this.form.controls.message.value): void {
    if (!text.trim() || this.chat.loading()) {
      return;
    }
    this.chat.send(text);
    this.form.reset();
  }
}
