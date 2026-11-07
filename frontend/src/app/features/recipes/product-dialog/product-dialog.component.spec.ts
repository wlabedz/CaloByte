import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { buildProduct } from '../../../../testing/recipe-fixtures';
import { Product } from '../../../core/models';
import { ProductRepository } from '../../../core/data/product-repository';
import { ProductDialogComponent } from './product-dialog.component';

describe('ProductDialogComponent', () => {
  const create = vi.fn();
  let fixture: ComponentFixture<ProductDialogComponent>;
  let element: HTMLElement;
  let created: ReturnType<typeof vi.fn<(product: Product) => void>>;

  const fill = (values: Record<string, string>) => {
    for (const [name, value] of Object.entries(values)) {
      const input = element.querySelector<HTMLInputElement>(`[formControlName="${name}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  };
  const save = async () => {
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
  };
  const valid = { name: 'Mój jogurt', kcal: '60', protein: '5', fat: '3', carbs: '4', fiber: '0' };

  beforeEach(async () => {
    create.mockReset();
    await TestBed.configureTestingModule({
      imports: [ProductDialogComponent],
      providers: [{ provide: ProductRepository, useValue: { create } }],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductDialogComponent);
    created = vi.fn<(product: Product) => void>();
    fixture.componentInstance.created.subscribe(created);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('rejects macros summing over 100 g', async () => {
    fill({ ...valid, protein: '50', fat: '40', carbs: '20' });
    await save();

    expect(create).not.toHaveBeenCalled();
    expect(element.textContent).toContain(
      'Białko, tłuszcze i węglowodany nie mogą razem przekraczać 100 g',
    );
  });

  it('rejects kcal over 900 and a missing name', async () => {
    fill({ ...valid, name: '', kcal: '901' });
    await save();

    expect(create).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Podaj nazwę produktu');
    expect(element.textContent).toContain('Kalorie: od 0 do 900 kcal');
  });

  it('rejects fiber over 100 g', async () => {
    fill({ ...valid, fiber: '101' });
    await save();

    expect(create).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Błonnik: od 0 do 100 g');
  });

  it('creates the product and emits it', async () => {
    const product = buildProduct({ id: 'p9', source: 'user', name: 'Mój jogurt' });
    create.mockReturnValue(of(product));
    fill(valid);
    await save();

    expect(create).toHaveBeenCalledWith({
      name: 'Mój jogurt',
      kcal: 60,
      protein: 5,
      fat: 3,
      carbs: 4,
      fiber: 0,
    });
    expect(created).toHaveBeenCalledWith(product);
  });

  it('shows an error when saving fails', async () => {
    create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    fill(valid);
    await save();

    expect(created).not.toHaveBeenCalled();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Nie udało się zapisać produktu',
    );
  });
});
