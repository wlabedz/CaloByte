import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';

import { buildRecipeDetail } from '../../../../testing/recipe-fixtures';
import { RecipeRepository } from '../../../core/data/recipe-repository';
import { ToastService } from '../../../core/toast.service';
import { RecipeDetail } from '../../../core/models';
import { RecipeDetailComponent } from './recipe-detail.component';

describe('RecipeDetailComponent', () => {
  const get = vi.fn();
  const remove = vi.fn();
  const create = vi.fn();
  const show = vi.fn();
  let fixture: ComponentFixture<RecipeDetailComponent>;
  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;

  const setup = async (result: RecipeDetail | Error | HttpErrorResponse) => {
    get.mockReturnValue(
      result instanceof Error || result instanceof HttpErrorResponse
        ? throwError(() => result)
        : of(result),
    );
    await TestBed.configureTestingModule({
      imports: [RecipeDetailComponent],
      providers: [
        provideRouter([]),
        { provide: RecipeRepository, useValue: { get, remove, create } },
        { provide: ToastService, useValue: { show } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'r1' }) } },
        },
      ],
    }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(RecipeDetailComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  };
  const clickDelete = () => {
    element.querySelector<HTMLButtonElement>('button.delete-button')!.click();
    fixture.detectChanges();
  };
  const buttons = () =>
    Array.from(element.querySelectorAll('button, a'), (e) => e.textContent?.trim());

  beforeEach(() => {
    // Zalogowany autor przepisów `user_id: 'me'`.
    localStorage.setItem('calobyte.activeUser', JSON.stringify({ id: 'me', name: 'Ja Testowy' }));
    get.mockReset();
    remove.mockReset();
    remove.mockReturnValue(of(undefined));
    create.mockReset();
    show.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("hides edit and delete on someone else's recipe", async () => {
    await setup(buildRecipeDetail({ id: 'r1', source: 'user', user_id: 'someone-else' }));

    expect(buttons()).not.toContain('Edytuj');
    expect(element.querySelector('button.delete-button')).toBeNull();
  });

  it('shows a kaggle recipe read-only with source link', async () => {
    await setup(
      buildRecipeDetail({
        id: 'r1',
        name: 'Zupa',
        source: 'kaggle',
        kcal: 320,
        ingredients_text: ['1 szklanka mąki', '2 jajka'],
        directions: 'Wymieszaj i ugotuj.',
        source_url: 'https://www.allrecipes.com/recipe/1',
      }),
    );

    const text = element.textContent?.replace(/\s+/g, ' ');
    expect(text).toContain('Zupa');
    expect(text).toContain('320');
    expect(text).toContain('1 szklanka mąki');
    expect(text).toContain('2 jajka');
    expect(text).toContain('Wymieszaj i ugotuj.');
    const link = element.querySelector<HTMLAnchorElement>('a[target="_blank"]')!;
    expect(link.textContent?.trim()).toBe('Źródło: Allrecipes');
    expect(link.getAttribute('href')).toBe('https://www.allrecipes.com/recipe/1');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(buttons()).not.toContain('Edytuj');
    expect(buttons()).not.toContain('Usuń');
  });

  it('deletes a user recipe without a confirm dialog and offers undo in a toast', async () => {
    await setup(buildRecipeDetail({ id: 'r1', name: 'Jajecznica', source: 'user', user_id: 'me' }));
    const confirmSpy = vi.spyOn(window, 'confirm');

    expect(buttons()).toContain('Edytuj');
    clickDelete();
    await fixture.whenStable();

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith('r1');
    expect(navigate).toHaveBeenCalledWith(['/recipes']);
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Usunięto przepis „Jajecznica”.',
        action: expect.objectContaining({ label: 'Cofnij' }),
      }),
    );
  });

  it('restores the recipe with the same data when undo is clicked', async () => {
    const recipe = buildRecipeDetail({
      id: 'r1',
      name: 'Jajecznica',
      source: 'user',
      user_id: 'me',
      servings: 2,
      category: 'Śniadanie',
      prep_min: 5,
      cook_min: 10,
      directions: 'Usmaż.',
      items: [
        {
          product_id: 'p1',
          product_name: 'Jajko',
          weight_g: 100,
          kcal: 143,
          protein: 12.6,
          fat: 9.5,
          carbs: 0.7,
          fiber: 0,
        },
      ],
    });
    await setup(recipe);
    create.mockReturnValue(of(buildRecipeDetail({ id: 'r2', source: 'user', user_id: 'me' })));
    clickDelete();
    await fixture.whenStable();

    show.mock.calls[0][0].action.run();

    expect(create).toHaveBeenCalledWith({
      name: 'Jajecznica',
      servings: 2,
      category: 'Śniadanie',
      prep_min: 5,
      cook_min: 10,
      directions: 'Usmaż.',
      items: [{ product_id: 'p1', weight_g: 100 }],
    });
    expect(navigate).toHaveBeenLastCalledWith(['/recipes', 'r2']);
  });

  it('shows an error and stays on the page when delete fails', async () => {
    await setup(buildRecipeDetail({ id: 'r1', name: 'Jajecznica', source: 'user', user_id: 'me' }));
    remove.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    clickDelete();
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Nie udało się usunąć przepisu „Jajecznica”. Spróbuj ponownie.',
    );
  });

  it('does not send a second delete while the first is in flight', async () => {
    await setup(buildRecipeDetail({ id: 'r1', source: 'user', user_id: 'me' }));
    remove.mockReturnValue(NEVER);

    clickDelete();
    await fixture.whenStable();
    clickDelete();

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('navigates to the list on 404', async () => {
    await setup(new HttpErrorResponse({ status: 404 }));

    expect(navigate).toHaveBeenCalledWith(['/recipes']);
  });

  it('shows an error message on other failures', async () => {
    await setup(new HttpErrorResponse({ status: 500 }));

    expect(navigate).not.toHaveBeenCalled();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Nie udało się wczytać przepisu. Spróbuj odświeżyć stronę.',
    );
  });

  it('shows the servings count with the Polish plural form', async () => {
    await setup(buildRecipeDetail({ id: 'r1', servings: 2 }));

    expect(element.querySelector('.meta')!.textContent?.replace(/\s+/g, ' ')).toContain('2 porcje');
  });
});
