import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ChatRecipe, ChatReply, ChatService } from '../../core/chat.service';
import { ChatComponent } from './chat.component';

const recipe = (overrides: Partial<ChatRecipe> = {}): ChatRecipe => ({
  id: 1,
  meal: 'Śniadanie',
  title: 'Owsianka proteinowa',
  original_title: 'Protein Oatmeal',
  image: 'https://img.spoonacular.com/1.jpg',
  url: 'https://example.com/oatmeal',
  ready_in_minutes: 10,
  servings: 1,
  calories: 420,
  protein_g: 30,
  carbs_g: 50,
  fat_g: 10,
  ...overrides,
});

const reply = (overrides: Partial<ChatReply> = {}): ChatReply => ({
  message: 'Oto propozycje.',
  recipes: [recipe(), recipe({ id: 2, meal: 'Obiad', title: 'Kurczak z ryżem', calories: 650 })],
  interaction_id: 'i-1',
  ...overrides,
});

describe('ChatComponent', () => {
  const send = vi.fn();
  let fixture: ComponentFixture<ChatComponent>;
  let element: HTMLElement;

  const textOf = (selector: string) =>
    element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const typeAndSend = async (text: string) => {
    const input = element.querySelector<HTMLInputElement>('#chat-input')!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    send.mockReset().mockReturnValue(of(reply()));

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [{ provide: ChatService, useValue: { send } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('shows suggestions before the conversation starts', () => {
    expect(element.querySelectorAll('.suggestion')).toHaveLength(3);
  });

  it('sends a message and shows the answer with recipe cards and totals', async () => {
    await typeAndSend('Jadłospis na 2000 kcal');

    expect(send).toHaveBeenCalledWith('Jadłospis na 2000 kcal', null);
    expect(textOf('.bubble.user')).toBe('Jadłospis na 2000 kcal');
    expect(textOf('.assistant .bubble')).toBe('Oto propozycje.');
    expect(Array.from(element.querySelectorAll('.recipe-title'), (t) => t.textContent)).toEqual([
      'Owsianka proteinowa',
      'Kurczak z ryżem',
    ]);
    // Separator tysięcy zależy od LOCALE_ID, którego test nie ustawia.
    expect(textOf('.totals')).toMatch(/1\D?070 kcal, białko 60 g/);
  });

  it('continues the conversation with the interaction id from the previous reply', async () => {
    await typeAndSend('Śniadanie');
    await typeAndSend('A coś szybszego?');

    expect(send).toHaveBeenLastCalledWith('A coś szybszego?', 'i-1');
  });

  it('sends a clicked suggestion as a message', async () => {
    element.querySelector<HTMLButtonElement>('.suggestion')!.click();
    await fixture.whenStable();

    expect(send).toHaveBeenCalledWith('Ułóż mi jadłospis na 2000 kcal z dużą ilością białka', null);
  });

  it('shows an error when the request fails', async () => {
    send.mockReturnValue(throwError(() => new Error('502')));

    await typeAndSend('Hej');

    expect(textOf('.alert')).toBe('Nie udało się uzyskać odpowiedzi. Spróbuj ponownie za chwilę.');
  });

  it('ignores empty messages', async () => {
    await typeAndSend('   ');

    expect(send).not.toHaveBeenCalled();
  });

  it('starts a new conversation without the previous interaction id', async () => {
    await typeAndSend('Śniadanie');
    element.querySelector<HTMLButtonElement>('.secondary-button')!.click();
    await fixture.whenStable();
    await typeAndSend('Obiad');

    expect(element.querySelectorAll('.bubble.user')).toHaveLength(1);
    expect(send).toHaveBeenLastCalledWith('Obiad', null);
  });
});
