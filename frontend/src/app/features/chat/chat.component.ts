import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ChatRecipe, ChatService } from '../../core/chat.service';

interface RecipeTotals {
  calories: number;
  protein: number;
}

type ChatEntry =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; recipes: ChatRecipe[]; totals: RecipeTotals };

const sumRecipes = (recipes: ChatRecipe[]): RecipeTotals => ({
  calories: recipes.reduce((sum, recipe) => sum + (recipe.calories ?? 0), 0),
  protein: recipes.reduce((sum, recipe) => sum + (recipe.protein_g ?? 0), 0),
});

@Component({
  selector: 'app-chat',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  private readonly chatService = inject(ChatService);

  protected readonly suggestions = [
    'Ułóż mi jadłospis na 2000 kcal z dużą ilością białka',
    'Szybka kolacja do 500 kcal bez laktozy',
    'Wegetariański obiad do 700 kcal',
  ];

  protected readonly entries = signal<ChatEntry[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = new FormGroup({
    message: new FormControl('', { nonNullable: true }),
  });

  // Historię rozmowy trzyma Gemini; front pamięta tylko, którą rozmowę kontynuować.
  private interactionId: string | null = null;

  protected send(text = this.form.controls.message.value): void {
    const message = text.trim();
    if (!message || this.loading()) {
      return;
    }

    this.entries.update((entries) => [...entries, { role: 'user', text: message }]);
    this.form.reset();
    this.loading.set(true);
    this.errorMessage.set(null);

    this.chatService.send(message, this.interactionId).subscribe({
      next: (reply) => {
        this.interactionId = reply.interaction_id;
        this.entries.update((entries) => [
          ...entries,
          {
            role: 'assistant',
            text: reply.message,
            recipes: reply.recipes,
            totals: sumRecipes(reply.recipes),
          },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Nie udało się uzyskać odpowiedzi. Spróbuj ponownie za chwilę.');
        this.loading.set(false);
      },
    });
  }

  protected newConversation(): void {
    this.interactionId = null;
    this.entries.set([]);
    this.errorMessage.set(null);
  }
}
