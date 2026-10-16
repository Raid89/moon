import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';
export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
  title: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<readonly ToastMessage[]>([]);
  private nextId = 0;

  show({
    message,
    title,
    tone = 'info',
    duration = 5000,
  }: Omit<ToastMessage, 'id' | 'tone'> & { tone?: ToastTone; duration?: number }): void {
    const id = this.nextId++;
    this.messages.update((messages) => [...messages, { id, message, title, tone }]);
    if (duration > 0) window.setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }
}
