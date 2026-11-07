import { Injectable, signal } from '@angular/core';

export type ToastCloseReason = 'action' | 'dismiss' | 'timeout';

export interface ToastOptions {
  message: string;
  /** Przycisk w powiadomieniu, np. „Cofnij”. */
  action?: { label: string; run: () => void };
  /** Wywoływane raz, gdy powiadomienie znika, z informacją dlaczego. */
  onClose?: (reason: ToastCloseReason) => void;
  /** Czas widoczności w ms. */
  duration?: number;
}

export interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
}

interface Countdown {
  options: ToastOptions;
  remaining: number;
  startedAt: number;
  handle?: ReturnType<typeof setTimeout>;
}

const DEFAULT_DURATION = 6000;

/**
 * Krótkie powiadomienia na dole ekranu. Odliczanie stoi, dopóki kursor albo fokus jest
 * na powiadomieniu, żeby dało się spokojnie kliknąć „Cofnij” także z klawiatury.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly countdowns = new Map<number, Countdown>();
  private readonly visible = signal<Toast[]>([]);
  readonly toasts = this.visible.asReadonly();

  show(options: ToastOptions): number {
    const id = this.nextId++;
    this.countdowns.set(id, {
      options,
      remaining: options.duration ?? DEFAULT_DURATION,
      startedAt: 0,
    });
    this.visible.update((toasts) => [
      ...toasts,
      { id, message: options.message, actionLabel: options.action?.label },
    ]);
    this.resume(id);
    return id;
  }

  runAction(id: number): void {
    const countdown = this.countdowns.get(id);
    if (!countdown) {
      return;
    }
    countdown.options.action?.run();
    this.close(id, 'action');
  }

  dismiss(id: number): void {
    this.close(id, 'dismiss');
  }

  pause(id: number): void {
    const countdown = this.countdowns.get(id);
    if (!countdown?.handle) {
      return;
    }
    clearTimeout(countdown.handle);
    countdown.handle = undefined;
    countdown.remaining -= Date.now() - countdown.startedAt;
  }

  resume(id: number): void {
    const countdown = this.countdowns.get(id);
    if (!countdown || countdown.handle) {
      return;
    }
    countdown.startedAt = Date.now();
    countdown.handle = setTimeout(
      () => this.close(id, 'timeout'),
      Math.max(countdown.remaining, 0),
    );
  }

  private close(id: number, reason: ToastCloseReason): void {
    const countdown = this.countdowns.get(id);
    if (!countdown) {
      return;
    }
    clearTimeout(countdown.handle);
    this.countdowns.delete(id);
    this.visible.update((toasts) => toasts.filter((toast) => toast.id !== id));
    countdown.options.onClose?.(reason);
  }
}
