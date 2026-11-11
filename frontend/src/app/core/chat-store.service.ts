import { Injectable, inject, signal } from '@angular/core';

import { ChatRecipe, ChatService } from './chat.service';

export interface RecipeTotals {
  calories: number;
  protein: number;
}

export type ChatEntry =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; recipes: ChatRecipe[]; totals: RecipeTotals };

const sumRecipes = (recipes: ChatRecipe[]): RecipeTotals => ({
  calories: recipes.reduce((sum, recipe) => sum + (recipe.calories ?? 0), 0),
  protein: recipes.reduce((sum, recipe) => sum + (recipe.protein_g ?? 0), 0),
});

/**
 * Jedna rozmowa na całą aplikację: widok `/chat` i pływające okienko czatu pokazują
 * te same wiadomości, więc rozmowę można zacząć na dowolnej stronie i dokończyć na
 * pełnym ekranie. Rozmowa żyje do odświeżenia strony.
 */
@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly chatService = inject(ChatService);

  private readonly entriesState = signal<ChatEntry[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  readonly entries = this.entriesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly errorMessage = this.errorState.asReadonly();

  // Historię rozmowy trzyma Gemini; front pamięta tylko, którą rozmowę kontynuować.
  private interactionId: string | null = null;

  send(text: string): void {
    const message = text.trim();
    if (!message || this.loadingState()) {
      return;
    }

    this.entriesState.update((entries) => [...entries, { role: 'user', text: message }]);
    this.loadingState.set(true);
    this.errorState.set(null);

    this.chatService.send(message, this.interactionId).subscribe({
      next: (reply) => {
        this.interactionId = reply.interaction_id;
        this.entriesState.update((entries) => [
          ...entries,
          {
            role: 'assistant',
            text: reply.message,
            recipes: reply.recipes,
            totals: sumRecipes(reply.recipes),
          },
        ]);
        this.loadingState.set(false);
      },
      error: () => {
        this.errorState.set('Nie udało się uzyskać odpowiedzi. Spróbuj ponownie za chwilę.');
        this.loadingState.set(false);
      },
    });
  }

  newConversation(): void {
    this.interactionId = null;
    this.entriesState.set([]);
    this.errorState.set(null);
  }
}
