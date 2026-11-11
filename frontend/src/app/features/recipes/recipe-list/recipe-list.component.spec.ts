import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { buildRecipeSummary } from '../../../../testing/recipe-fixtures';
import { RecipeRepository } from '../../../core/data/recipe-repository';
import { Page, RecipeSummary } from '../../../core/models';
import { RecipeListComponent } from './recipe-list.component';

describe('RecipeListComponent', () => {
  const page = (items: RecipeSummary[], total = items.length, pageNo = 1): Page<RecipeSummary> => ({
    items,
    total,
    page: pageNo,
    limit: 20,
  });
  const list = vi.fn();
  const categories = vi.fn();
  let fixture: ComponentFixture<RecipeListComponent>;
  let element: HTMLElement;

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeListComponent],
      providers: [provideRouter([]), { provide: RecipeRepository, useValue: { list, categories } }],
    }).compileComponents();
    fixture = TestBed.createComponent(RecipeListComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  };
  const button = (text: string) =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes(text),
    )!;

  beforeEach(() => {
    list.mockReset();
    categories.mockReset();
    list.mockReturnValue(
      of(
        page(
          [
            buildRecipeSummary({ id: '1', name: 'Zupa pomidorowa', category: 'Zupy', kcal: 320 }),
            buildRecipeSummary({ id: '2', name: 'Szarlotka', category: 'Desery', kcal: 410 }),
          ],
          45,
        ),
      ),
    );
    categories.mockReturnValue(of([{ category: 'Zupy', count: 3 }]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders cards with name, category and kcal per serving', async () => {
    await setup();

    const cards = element.querySelectorAll('.recipe-card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Zupa pomidorowa');
    expect(cards[0].textContent).toContain('Zupy');
    expect(cards[0].textContent?.replace(/\s+/g, ' ')).toContain('320 kcal / porcja');
    expect(list).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('searches after a 300 ms debounce', async () => {
    await setup();
    vi.useFakeTimers();
    const input = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = 'zupa';
    input.dispatchEvent(new Event('input'));

    vi.advanceTimersByTime(299);
    fixture.detectChanges();
    expect(list).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'zupa', page: 1 }));
  });

  it('filters by category and by own recipes, resetting the page', async () => {
    await setup();
    button('Następna').click();
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));

    const select = element.querySelector<HTMLSelectElement>('select')!;
    select.value = 'Zupy';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Zupy', page: 1 }));

    button('Następna').click();
    await fixture.whenStable();
    button('Moje').click();
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'Zupy', mine: true, page: 1 }),
    );
  });

  it('pages forward and disables Next on the last page', async () => {
    await setup();
    expect(button('Poprzednia').disabled).toBe(true);

    button('Następna').click();
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));

    button('Następna').click();
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }));
    expect(button('Następna').disabled).toBe(true);
  });

  it('shows an error message when loading fails', async () => {
    list.mockReturnValue(throwError(() => new Error('boom')));
    await setup();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Nie udało się wczytać przepisów. Spróbuj odświeżyć stronę.',
    );
  });
});
