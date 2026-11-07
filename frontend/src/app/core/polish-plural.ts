/**
 * Polska forma liczebnika: 1 → `one`; 2–4, 22–24, … (z wyjątkiem 12–14) → `few`; reszta → `many`.
 */
export function polishPlural(count: number, one: string, few: string, many: string): string {
  if (count === 1) {
    return one;
  }
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
}

/** „1 porcja”, „2 porcje”, „5 porcji”. */
export function servingsLabel(count: number): string {
  return `${count} ${polishPlural(count, 'porcja', 'porcje', 'porcji')}`;
}
