import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { buildRecipeDetail } from '../../../../testing/recipe-fixtures';
import { RecipeRepository } from '../../../core/data/recipe-repository';
import { RecipeDetail } from '../../../core/models';
import { RecipeDetailComponent } from './recipe-detail.component';

describe('RecipeDetailComponent', () => {
  const get = vi.fn();
  const remove = vi.fn();
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
        { provide: RecipeRepository, useValue: { get, remove } },
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
  const buttons = () =>
    Array.from(element.querySelectorAll('button, a'), (e) => e.textContent?.trim());

  beforeEach(() => {
    get.mockReset();
    remove.mockReset();
    remove.mockReturnValue(of(undefined));
  });

  afterEach(() => vi.restoreAllMocks());

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

  it('shows edit and delete for a user recipe; delete navigates to the list', async () => {
    await setup(buildRecipeDetail({ id: 'r1', source: 'user' }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    expect(buttons()).toContain('Edytuj');
    element.querySelector<HTMLButtonElement>('button.delete-button')!.click();
    await fixture.whenStable();

    expect(remove).toHaveBeenCalledWith('r1');
    expect(navigate).toHaveBeenCalledWith(['/recipes']);
  });

  it('does not delete when cancelled', async () => {
    await setup(buildRecipeDetail({ id: 'r1', source: 'user' }));
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    element.querySelector<HTMLButtonElement>('button.delete-button')!.click();

    expect(remove).not.toHaveBeenCalled();
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
