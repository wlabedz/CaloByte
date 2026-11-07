import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(ToastService);
  });

  afterEach(() => vi.useRealTimers());

  it('hides a toast after its duration', () => {
    const onClose = vi.fn();

    service.show({ message: 'Zapisano', duration: 3000, onClose });
    expect(service.toasts().map((toast) => toast.message)).toEqual(['Zapisano']);

    vi.advanceTimersByTime(3000);

    expect(service.toasts()).toEqual([]);
    expect(onClose).toHaveBeenCalledWith('timeout');
  });

  it('runs the action once and closes the toast', () => {
    const run = vi.fn();
    const onClose = vi.fn();
    const id = service.show({ message: 'Usunięto', action: { label: 'Cofnij', run }, onClose });

    service.runAction(id);
    service.runAction(id);
    vi.advanceTimersByTime(10_000);

    expect(run).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('action');
    expect(service.toasts()).toEqual([]);
  });

  it('stops counting down while paused', () => {
    const id = service.show({ message: 'Usunięto', duration: 3000 });

    vi.advanceTimersByTime(2000);
    service.pause(id);
    vi.advanceTimersByTime(5000);
    expect(service.toasts()).toHaveLength(1);

    service.resume(id);
    vi.advanceTimersByTime(999);
    expect(service.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(service.toasts()).toEqual([]);
  });
});
