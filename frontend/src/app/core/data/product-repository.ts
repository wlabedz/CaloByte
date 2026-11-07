import { Observable } from 'rxjs';

import { Product, ProductInput } from '../models';

export abstract class ProductRepository {
  abstract search(q: string): Observable<Product[]>;
  abstract create(input: ProductInput): Observable<Product>;
}
