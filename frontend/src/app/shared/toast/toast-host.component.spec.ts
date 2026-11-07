import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastService } from '../../core/toast.service';
import { ToastHostComponent } from './toast-host.component';

describe('ToastHostComponent', () => {
  let fixture: ComponentFixture<ToastHostComponent>;
  let element: HTMLElement;
  let toasts: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToastHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(ToastHostComponent);
    element = fixture.nativeElement;
    toasts = TestBed.inject(ToastService);
  });

  it('shows a toast and runs its action', async () => {
    const run = vi.fn();
    toasts.show({ message: 'Usunięto posiłek „Owsianka”.', action: { label: 'Cofnij', run } });
    await fixture.whenStable();

    expect(element.querySelector('.message')?.textContent).toContain('Owsianka');

    element.querySelector<HTMLButtonElement>('.action')?.click();
    await fixture.whenStable();

    expect(run).toHaveBeenCalled();
    expect(element.querySelector('.toast')).toBeNull();
  });

  it('closes a toast with the close button', async () => {
    const onClose = vi.fn();
    toasts.show({ message: 'Zapisano profil.', onClose });
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('[aria-label="Zamknij powiadomienie"]')?.click();
    await fixture.whenStable();

    expect(onClose).toHaveBeenCalledWith('dismiss');
    expect(element.querySelector('.toast')).toBeNull();
  });
});
