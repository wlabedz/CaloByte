import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TEST_TARGETS, buildMeal, daysAgo } from '../../../testing/meal-fixtures';
import { MealRepository } from '../../core/data/meal-repository';
import { toDayKey } from '../../core/nutrition';
import { HistoryComponent } from './history.component';

describe('HistoryComponent', () => {
  let element: HTMLElement;

  beforeEach(async () => {
    const meals = [
      buildMeal({ id: '1', eaten_at: daysAgo(0, 8).toISOString(), total_kcal: 300 }),
      buildMeal({ id: '2', eaten_at: daysAgo(1, 13).toISOString(), total_kcal: 500 }),
      buildMeal({ id: '3', eaten_at: daysAgo(1, 19).toISOString(), total_kcal: 300 }),
      buildMeal({ id: '4', eaten_at: daysAgo(2, 13).toISOString(), total_kcal: 600 }),
    ];

    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        {
          provide: MealRepository,
          useValue: { getTargets: () => of(TEST_TARGETS), getMeals: () => of(meals) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoryComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('shows one card per day, starting with today', () => {
    const days = Array.from(element.querySelectorAll('.day'));

    expect(days.map((day) => day.querySelector('time')?.getAttribute('datetime'))).toEqual([
      toDayKey(daysAgo(0)),
      toDayKey(daysAgo(1)),
      toDayKey(daysAgo(2)),
    ]);
    expect(days[0].querySelector('.day-name')?.textContent).toContain('Dzisiaj');
  });

  it('averages calories over finished days only', () => {
    // wczoraj 800 kcal, przedwczoraj 600 kcal; dzisiejsze 300 kcal nie wchodzi do średniej
    expect(element.querySelector('.trend')?.textContent?.replace(/\s+/g, ' ')).toContain(
      'Średnio 700 kcal',
    );
  });
});
