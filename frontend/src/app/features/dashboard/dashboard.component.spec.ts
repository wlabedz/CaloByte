import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TEST_TARGETS, buildMeal, daysAgo } from '../../../testing/meal-fixtures';
import { MealRepository } from '../../core/data/meal-repository';
import { ToastService } from '../../core/toast.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  const deleteMeal = vi.fn(() => of(undefined));
  let fixture: ComponentFixture<DashboardComponent>;
  let element: HTMLElement;

  const mealNames = () =>
    Array.from(element.querySelectorAll('.meal-name'), (name) => name.textContent?.trim());
  const textOf = (selector: string) =>
    element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const clickDelete = async (mealName: string) => {
    element.querySelector<HTMLButtonElement>(`[aria-label="Usuń posiłek ${mealName}"]`)?.click();
    await fixture.whenStable();
  };
  const toasts = () => TestBed.inject(ToastService);
  const firstToastId = () => toasts().toasts()[0].id;

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
    deleteMeal.mockReset();
    deleteMeal.mockImplementation(() => of(undefined));
  });

  it("lists only today's meals in chronological order with the remaining calories", () => {
    expect(mealNames()).toEqual(['Owsianka', 'Kurczak z ryżem']);
    expect(textOf('.kcal-balance')).toBe('Zostało 450 kcal');
  });

  it('hides a deleted meal at once and offers undo', async () => {
    await clickDelete('Owsianka');

    expect(mealNames()).toEqual(['Kurczak z ryżem']);
    expect(textOf('.kcal-balance')).toBe('Zostało 850 kcal');
    expect(toasts().toasts()[0]).toMatchObject({
      message: 'Usunięto posiłek „Owsianka”.',
      actionLabel: 'Cofnij',
    });
    expect(deleteMeal).not.toHaveBeenCalled();

    toasts().runAction(firstToastId());
  });

  it('brings the meal back on undo without deleting it', async () => {
    await clickDelete('Owsianka');

    toasts().runAction(firstToastId());
    await fixture.whenStable();

    expect(mealNames()).toEqual(['Owsianka', 'Kurczak z ryżem']);
    expect(deleteMeal).not.toHaveBeenCalled();
  });

  it('deletes the meal once the notification closes', async () => {
    await clickDelete('Owsianka');

    toasts().dismiss(firstToastId());
    await fixture.whenStable();

    expect(deleteMeal).toHaveBeenCalledWith('2');
    expect(mealNames()).toEqual(['Kurczak z ryżem']);
  });

  it('brings the meal back with a message when deletion fails', async () => {
    deleteMeal.mockImplementation(() => throwError(() => new Error('500')));
    await clickDelete('Owsianka');

    toasts().dismiss(firstToastId());
    await fixture.whenStable();

    expect(mealNames()).toEqual(['Owsianka', 'Kurczak z ryżem']);
    expect(textOf('[role="alert"]')).toContain('Nie udało się usunąć posiłku „Owsianka”');
  });
});
