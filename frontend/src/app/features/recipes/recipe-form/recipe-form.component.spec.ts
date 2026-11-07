import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';

import { buildProduct, buildRecipeDetail } from '../../../../testing/recipe-fixtures';
import { ProductRepository } from '../../../core/data/product-repository';
import { RecipeRepository } from '../../../core/data/recipe-repository';
import { recipePerServing } from '../../../core/nutrition';
import { RecipeFormComponent } from './recipe-form.component';

describe('RecipeFormComponent', () => {
  const get = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const search = vi.fn();
  const createProduct = vi.fn();
  let fixture: ComponentFixture<RecipeFormComponent>;
  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;

  const egg = buildProduct({
    id: 'p1',
    name: 'Jajko',
    kcal: 200,
    protein: 10,
    fat: 5,
    carbs: 20,
    fiber: 2,
  });

  const setup = async (id?: string) => {
    await TestBed.configureTestingModule({
      imports: [RecipeFormComponent],
      providers: [
        provideRouter([]),
        { provide: RecipeRepository, useValue: { get, create, update } },
        { provide: ProductRepository, useValue: { search, create: createProduct } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(id ? { id } : {}) },
          },
        },
      ],
    }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(RecipeFormComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  };
  const input = (selector: string) => element.querySelector<HTMLInputElement>(selector)!;
  const type = (selector: string, value: string) => {
    const el = input(selector);
    el.value = value;
    el.dispatchEvent(new Event('input'));
  };
  const button = (text: string) =>
    Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.trim() === text)!;
  const text = () => element.textContent?.replace(/\s+/g, ' ') ?? '';

  /** Wpisuje frazę, czeka na debounce i wybiera pierwszy wynik. */
  const addProduct = async (query = 'jaj') => {
    vi.useFakeTimers();
    type('input[type="search"]', query);
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>('.search-results button')!.click();
    await fixture.whenStable();
  };
  const fillValid = async () => {
    type('[formControlName="name"]', 'Omlet');
    await addProduct();
  };

  beforeEach(() => {
    for (const fn of [get, create, update, search, createProduct]) {
      fn.mockReset();
    }
    search.mockReturnValue(of([egg]));
    create.mockReturnValue(of(buildRecipeDetail({ id: 'new1' })));
    update.mockReturnValue(of(buildRecipeDetail({ id: 'r1' })));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is empty for /recipes/new', async () => {
    await setup();

    expect(input('[formControlName="name"]').value).toBe('');
    expect(get).not.toHaveBeenCalled();
    expect(element.querySelectorAll('.item-row').length).toBe(0);
  });

  it('is filled from get(id) for /recipes/:id/edit', async () => {
    get.mockReturnValue(
      of(
        buildRecipeDetail({
          id: 'r1',
          source: 'user',
          name: 'Omlet',
          servings: 2,
          category: 'Śniadania',
          prep_min: 5,
          cook_min: 10,
          directions: 'Usmaż.',
          items: [
            {
              product_id: 'p1',
              product_name: 'Jajko',
              weight_g: 200,
              kcal: 400,
              protein: 20,
              fat: 10,
              carbs: 40,
              fiber: 4,
            },
          ],
        }),
      ),
    );
    await setup('r1');

    expect(get).toHaveBeenCalledWith('r1');
    expect(input('[formControlName="name"]').value).toBe('Omlet');
    expect(input('[formControlName="servings"]').value).toBe('2');
    expect(element.querySelectorAll('.item-row').length).toBe(1);
    expect(element.querySelector('.item-row')!.textContent).toContain('Jajko');
    expect(input('.item-row input').value).toBe('200');
    // makro na porcję pochodzi z wartości na 100 g wyprowadzonych ze składnika: 400 kcal / 2
    expect(element.querySelector('.preview .kcal')!.textContent).toContain('200');
  });

  it('redirects to the detail page when editing a non-user recipe', async () => {
    get.mockReturnValue(of(buildRecipeDetail({ id: 'k1', source: 'kaggle' })));
    await setup('k1');

    expect(navigate).toHaveBeenCalledWith(['/recipes', 'k1']);
  });

  it('shows errors and skips the repository when name, servings or items are invalid', async () => {
    await setup();
    type('[formControlName="servings"]', '0');
    button('Zapisz').click();
    await fixture.whenStable();

    expect(create).not.toHaveBeenCalled();
    expect(text()).toContain('Podaj nazwę przepisu');
    expect(text()).toContain('Liczba porcji musi być z zakresu 1–100');
    expect(text()).toContain('Dodaj co najmniej jeden składnik');
  });

  it('searches with the trimmed query after 300 ms and adds a 100 g row on pick', async () => {
    await setup();
    vi.useFakeTimers();
    type('input[type="search"]', '  jaj ');
    vi.advanceTimersByTime(299);
    expect(search).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    vi.useRealTimers();
    await fixture.whenStable();
    expect(search).toHaveBeenCalledWith('jaj');

    element.querySelector<HTMLButtonElement>('.search-results button')!.click();
    await fixture.whenStable();

    expect(element.querySelectorAll('.item-row').length).toBe(1);
    expect(input('.item-row input').value).toBe('100');
  });

  it('does not search for fewer than 2 characters', async () => {
    await setup();
    vi.useFakeTimers();
    type('input[type="search"]', 'j');
    vi.advanceTimersByTime(500);

    expect(search).not.toHaveBeenCalled();
  });

  it('updates the per-serving preview when weight or servings change', async () => {
    await setup();
    await addProduct();
    const kcal = () => element.querySelector('.preview .kcal')!.textContent;
    expect(kcal()).toContain('200');

    type('.item-row input', '200');
    await fixture.whenStable();
    const expected = recipePerServing([{ product: egg, weight_g: 200 }], 1);
    expect(expected.kcal).toBe(400);
    expect(kcal()).toContain('400');

    type('[formControlName="servings"]', '4');
    await fixture.whenStable();
    expect(kcal()).toContain('100');
  });

  it('creates the recipe and navigates to it', async () => {
    await setup();
    await fillValid();
    type('[formControlName="servings"]', '2');
    type('[formControlName="category"]', 'Śniadania');
    type('[formControlName="directions"]', 'Usmaż.');
    type('.item-row input', '150');
    button('Zapisz').click();
    await fixture.whenStable();

    expect(create).toHaveBeenCalledWith({
      name: 'Omlet',
      servings: 2,
      category: 'Śniadania',
      prep_min: null,
      cook_min: null,
      directions: 'Usmaż.',
      items: [{ product_id: 'p1', weight_g: 150 }],
    });
    expect(navigate).toHaveBeenCalledWith(['/recipes', 'new1']);
  });

  it('updates an existing recipe in edit mode', async () => {
    get.mockReturnValue(
      of(
        buildRecipeDetail({
          id: 'r1',
          source: 'user',
          items: [
            {
              product_id: 'p1',
              product_name: 'Jajko',
              weight_g: 100,
              kcal: 200,
              protein: 10,
              fat: 5,
              carbs: 20,
              fiber: 2,
            },
          ],
        }),
      ),
    );
    await setup('r1');
    button('Zapisz').click();
    await fixture.whenStable();

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({ items: [{ product_id: 'p1', weight_g: 100 }] }),
    );
    expect(navigate).toHaveBeenCalledWith(['/recipes', 'r1']);
  });

  it('shows the backend detail on 422', async () => {
    create.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 422, error: { detail: 'Produkt nie istnieje' } }),
      ),
    );
    await setup();
    await fillValid();
    button('Zapisz').click();
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')!.textContent).toContain('Produkt nie istnieje');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows a generic message on a 422 without a string detail', async () => {
    create.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { detail: [{ msg: 'x' }] } })),
    );
    await setup();
    await fillValid();
    button('Zapisz').click();
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')!.textContent).toContain(
      'Nie udało się zapisać przepisu. Sprawdź dane i spróbuj ponownie.',
    );
  });

  it('does not submit twice while saving', async () => {
    create.mockReturnValue(NEVER);
    await setup();
    await fillValid();
    button('Zapisz').click();
    await fixture.whenStable();
    button('Zapisz').click();
    await fixture.whenStable();

    expect(create).toHaveBeenCalledTimes(1);
    expect(button('Zapisz').disabled).toBe(true);
  });

  it('adds a product created in the dialog as an ingredient', async () => {
    const mine = buildProduct({ id: 'p9', name: 'Mój jogurt', source: 'user' });
    createProduct.mockReturnValue(of(mine));
    await setup();
    button('Dodaj własny produkt').click();
    await fixture.whenStable();
    const dialog = element.querySelector('app-product-dialog')!;
    const set = (name: string, value: string) => {
      const el = dialog.querySelector<HTMLInputElement>(`[formControlName="${name}"]`)!;
      el.value = value;
      el.dispatchEvent(new Event('input'));
    };
    set('name', 'Mój jogurt');
    set('kcal', '60');
    set('protein', '5');
    set('fat', '3');
    set('carbs', '4');
    dialog.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();

    expect(element.querySelector('app-product-dialog')).toBeNull();
    expect(element.querySelectorAll('.item-row').length).toBe(1);
    expect(element.querySelector('.item-row')!.textContent).toContain('Mój jogurt');
  });

  it('does not save the recipe when saving a product in the dialog', async () => {
    createProduct.mockReturnValue(
      of(buildProduct({ id: 'p9', name: 'Mój jogurt', source: 'user' })),
    );
    await setup();
    await fillValid();
    button('Dodaj własny produkt').click();
    await fixture.whenStable();
    const dialog = element.querySelector('app-product-dialog')!;
    const set = (name: string, value: string) => {
      const el = dialog.querySelector<HTMLInputElement>(`[formControlName="${name}"]`)!;
      el.value = value;
      el.dispatchEvent(new Event('input'));
    };
    set('name', 'Mój jogurt');
    set('kcal', '60');
    set('protein', '5');
    set('fat', '3');
    set('carbs', '4');
    dialog.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();

    expect(createProduct).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects more than 50 ingredients', async () => {
    await setup();
    type('[formControlName="name"]', 'Omlet');
    const component = fixture.componentInstance as unknown as { pick(product: typeof egg): void };
    for (let i = 0; i < 51; i++) {
      component.pick(egg);
    }
    await fixture.whenStable();
    button('Zapisz').click();
    await fixture.whenStable();

    expect(create).not.toHaveBeenCalled();
    expect(text()).toContain('Przepis może mieć maksymalnie 50 składników');
  });

  /**
   * Naciska Enter w polu. jsdom nie wykonuje niejawnego wysłania formularza, więc
   * odtwarzamy domyślną akcję przeglądarki: jeśli nikt nie wywołał preventDefault(),
   * formularz zostaje wysłany.
   */
  const pressEnter = (el: HTMLInputElement) => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    if (!event.defaultPrevented) {
      el.form?.requestSubmit();
    }
  };

  it('does not save the recipe on Enter in the product search', async () => {
    create.mockReturnValue(of(buildRecipeDetail({ id: 'new1' })));
    await setup();
    await fillValid();
    const search = input('input[type="search"]');
    search.value = 'mle';
    pressEnter(search);
    await fixture.whenStable();

    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('rejects preparation or cooking time above 10000 minutes', async () => {
    await setup();
    await fillValid();
    type('[formControlName="prep_min"]', '10001');
    button('Zapisz').click();
    await fixture.whenStable();

    expect(create).not.toHaveBeenCalled();
    expect(text()).toContain('Czas musi być liczbą z zakresu 0–10000 minut.');

    type('[formControlName="prep_min"]', '10000');
    type('[formControlName="cook_min"]', '10001');
    button('Zapisz').click();
    await fixture.whenStable();

    expect(create).not.toHaveBeenCalled();
    expect(text()).toContain('Czas musi być liczbą z zakresu 0–10000 minut.');
  });
});
