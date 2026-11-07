import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../../../environments/api-url';
import { buildProduct } from '../../../testing/recipe-fixtures';
import { HttpProductRepository } from './http-product-repository';

describe('HttpProductRepository', () => {
  let repo: HttpProductRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), HttpProductRepository],
    });
    repo = TestBed.inject(HttpProductRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches products by q', () => {
    const products = [buildProduct({ id: '1' })];
    let result: unknown;
    repo.search('jaj').subscribe((r) => (result = r));

    const req = http.expectOne(`${API_URL}/products?q=jaj`);
    expect(req.request.method).toBe('GET');
    req.flush(products);
    expect(result).toEqual(products);
  });

  it('omits empty q', () => {
    repo.search('').subscribe();
    const req = http.expectOne(`${API_URL}/products`);
    req.flush([]);
  });

  it('creates a product with POST', () => {
    const input = { name: 'Jajko', kcal: 143, protein: 12.6, fat: 9.5, carbs: 0.7, fiber: 0 };
    repo.create(input).subscribe();
    const req = http.expectOne(`${API_URL}/products`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(buildProduct({ id: 'n', ...input }));
  });
});
