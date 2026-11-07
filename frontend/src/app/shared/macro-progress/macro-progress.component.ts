import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { percentOf } from '../../core/nutrition';

/** Realizacja dziennego celu dla kalorii lub jednego makroskładnika. */
@Component({
  selector: 'app-macro-progress',
  imports: [DecimalPipe],
  templateUrl: './macro-progress.component.html',
  styleUrl: './macro-progress.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.over]': 'isOver()',
    '[style.--accent]': 'color()',
  },
})
export class MacroProgressComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  /** Bez celu (np. błonnik) pokazywana jest sama wartość. */
  readonly target = input<number>();
  readonly unit = input('g');
  readonly color = input('var(--primary)');

  protected readonly percent = computed(() => percentOf(this.value(), this.target() ?? 0));
  protected readonly barWidth = computed(() => Math.min(this.percent(), 100));
  protected readonly isOver = computed(() => {
    const target = this.target();
    return target !== undefined && this.value() > target;
  });
}
