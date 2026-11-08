import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../environments/api-url';

/**
 * Przepis polecony przez czat, z tabeli `recipes` (id prowadzi do `/recipes/:id`).
 * Wartości odżywcze są na porcję.
 */
export interface ChatRecipe {
  id: string;
  meal: string;
  title: string;
  original_title: string;
  category: string | null;
  url: string | null;
  ready_in_minutes: number | null;
  servings: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export interface ChatReply {
  message: string;
  recipes: ChatRecipe[];
  /** Id rozmowy po stronie Gemini, odsyłane z następną wiadomością. */
  interaction_id: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);

  send(message: string, interactionId: string | null): Observable<ChatReply> {
    return this.http.post<ChatReply>(`${API_URL}/chat`, {
      message,
      interaction_id: interactionId,
    });
  }
}
