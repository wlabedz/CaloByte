import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../../environments/api-url';
import {
  CategoryCount,
  Page,
  RecipeDetail,
  RecipeInput,
  RecipeQuery,
  RecipeSummary,
} from '../models';
import { RecipeRepository } from './recipe-repository';

@Injectable()
export class HttpRecipeRepository extends RecipeRepository {
  private readonly http = inject(HttpClient);

  list(query: RecipeQuery): Observable<Page<RecipeSummary>> {
    let params = new HttpParams();
    // Puste filtry pomijamy, żeby nie wysyłać `?q=&category=`.
    if (query.q) params = params.set('q', query.q);
    if (query.category) params = params.set('category', query.category);
    if (query.source) params = params.set('source', query.source);
    if (query.mine) params = params.set('mine', true);
    params = params.set('page', query.page).set('limit', query.limit);
    return this.http.get<Page<RecipeSummary>>(`${API_URL}/recipes`, { params });
  }

  categories(): Observable<CategoryCount[]> {
    return this.http.get<CategoryCount[]>(`${API_URL}/recipes/categories`);
  }

  get(id: string): Observable<RecipeDetail> {
    return this.http.get<RecipeDetail>(`${API_URL}/recipes/${encodeURIComponent(id)}`);
  }

  create(input: RecipeInput): Observable<RecipeDetail> {
    return this.http.post<RecipeDetail>(`${API_URL}/recipes`, input);
  }

  update(id: string, input: RecipeInput): Observable<RecipeDetail> {
    return this.http.put<RecipeDetail>(`${API_URL}/recipes/${encodeURIComponent(id)}`, input);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/recipes/${encodeURIComponent(id)}`);
  }
}
