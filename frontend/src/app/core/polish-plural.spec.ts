import { servingsLabel } from './polish-plural';

describe('servingsLabel', () => {
  it.each([
    [1, '1 porcja'],
    [2, '2 porcje'],
    [4, '4 porcje'],
    [5, '5 porcji'],
    [12, '12 porcji'],
    [22, '22 porcje'],
    [25, '25 porcji'],
  ])('%i → %s', (count, expected) => {
    expect(servingsLabel(count)).toBe(expected);
  });
});
