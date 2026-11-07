import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../../../environments/api-url';
import { buildRecipeDetail, buildRecipeSummary } from '../../../testing/recipe-fixtures';
import { RecipeInput } from '../models';
import { HttpRecipeRepository } from './http-recipe-repository';

describe('HttpRecipeRepository', () => {
  let repo: HttpRecipeRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), HttpRecipeRepository],
    });
    repo = TestBed.inject(HttpRecipeRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists recipes with query params', () => {
    const page = { items: [buildRecipeSummary({ id: '1' })], total: 1, page: 2, limit: 20 };
    let result: unknown;
    repo.list({ q: 'zupa', page: 2, limit: 20 }).subscribe((r) => (result = r));

    const req = http.expectOne(`${API_URL}/recipes?q=zupa&page=2&limit=20`);
    expect(req.request.method).toBe('GET');
    req.flush(page);
    expect(result).toEqual(page);
  });

  it('omits empty q and category from the URL', () => {
    repo.list({ q: '', category: '', page: 1, limit: 10 }).subscribe();

    const req = http.expectOne((r) => r.url === `${API_URL}/recipes`);
    expect(req.request.params.keys().sort()).toEqual(['limit', 'page']);
    req.flush({ items: [], total: 0, page: 1, limit: 10 });
  });

  it('sends category and source when set', () => {
    repo.list({ category: 'Zupy', source: 'user', page: 1, limit: 10 }).subscribe();

    const req = http.expectOne((r) => r.url === `${API_URL}/recipes`);
    expect(req.request.params.get('category')).toBe('Zupy');
    expect(req.request.params.get('source')).toBe('user');
    req.flush({ items: [], total: 0, page: 1, limit: 10 });
  });

  it('fetches categories', () => {
    repo.categories().subscribe();
    const req = http.expectOne(`${API_URL}/recipes/categories`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets one recipe', () => {
    repo.get('abc').subscribe();
    const req = http.expectOne(`${API_URL}/recipes/abc`);
    expect(req.request.method).toBe('GET');
    req.flush(buildRecipeDetail({ id: 'abc' }));
  });

  const input: RecipeInput = {
    name: 'Chleb z masłem',
    servings: 2,
    directions: 'Posmaruj.',
    items: [{ product_id: 'p1', weight_g: 100 }],
  };

  it('creates a recipe with POST and the input body', () => {
    repo.create(input).subscribe();
    const req = http.expectOne(`${API_URL}/recipes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(buildRecipeDetail({ id: 'new' }));
  });

  it('updates a recipe with PUT', () => {
    repo.update('abc', input).subscribe();
    const req = http.expectOne(`${API_URL}/recipes/abc`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(input);
    req.flush(buildRecipeDetail({ id: 'abc' }));
  });

  it('removes a recipe with DELETE', () => {
    let done = false;
    repo.remove('abc').subscribe(() => (done = true));
    const req = http.expectOne(`${API_URL}/recipes/abc`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(done).toBe(true);
  });
});
