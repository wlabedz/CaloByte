import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../../environments/api-url';
import { Product, ProductInput } from '../models';
import { ProductRepository } from './product-repository';

@Injectable()
export class HttpProductRepository extends ProductRepository {
  private readonly http = inject(HttpClient);

  search(q: string): Observable<Product[]> {
    const params = q ? new HttpParams().set('q', q) : new HttpParams();
    return this.http.get<Product[]>(`${API_URL}/products`, { params });
  }

  create(input: ProductInput): Observable<Product> {
    return this.http.post<Product>(`${API_URL}/products`, input);
  }
}
