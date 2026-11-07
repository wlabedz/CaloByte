import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TEST_TARGETS, buildMeal, daysAgo } from '../../../testing/meal-fixtures';
import { MealRepository } from '../../core/data/meal-repository';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  const deleteMeal = vi.fn(() => of(undefined));
  let fixture: ComponentFixture<DashboardComponent>;
  let element: HTMLElement;

  const mealNames = () =>
    Array.from(element.querySelectorAll('.meal-name'), (name) => name.textContent?.trim());
  const textOf = (selector: string) =>
    element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const clickDelete = (mealName: string) =>
    element.querySelector<HTMLButtonElement>(`[aria-label="Usuń posiłek ${mealName}"]`)?.click();

  beforeEach(async () => {
    const meals = [
      buildMeal({
        id: '1',
        name: 'Kurczak z ryżem',
        eaten_at: daysAgo(0, 13).toISOString(),
        total_kcal: 650,
      }),
      buildMeal({
        id: '2',
        name: 'Owsianka',
        meal_type: 'breakfast',
        eaten_at: daysAgo(0, 8).toISOString(),
        total_kcal: 400,
      }),
      buildMeal({
        id: '3',
        name: 'Wczorajsza pizza',
        eaten_at: daysAgo(1, 20).toISOString(),
        total_kcal: 900,
      }),
    ];

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        {
          provide: MealRepository,
          useValue: { getTargets: () => of(TEST_TARGETS), getMeals: () => of(meals), deleteMeal },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    deleteMeal.mockClear();
  });

  it("lists only today's meals in chronological order with the remaining calories", () => {
    expect(mealNames()).toEqual(['Owsianka', 'Kurczak z ryżem']);
    expect(textOf('.kcal-balance')).toBe('Zostało 450 kcal');
  });

  it('deletes a meal after confirmation and updates the balance', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    clickDelete('Owsianka');
    await fixture.whenStable();

    expect(deleteMeal).toHaveBeenCalledWith('2');
    expect(mealNames()).toEqual(['Kurczak z ryżem']);
    expect(textOf('.kcal-balance')).toBe('Zostało 850 kcal');
  });

  it('keeps the meal when deletion is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    clickDelete('Owsianka');
    await fixture.whenStable();

    expect(deleteMeal).not.toHaveBeenCalled();
    expect(mealNames()).toEqual(['Owsianka', 'Kurczak z ryżem']);
  });
});
