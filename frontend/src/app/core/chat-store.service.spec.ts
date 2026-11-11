import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ChatStore } from './chat-store.service';
import { ChatService } from './chat.service';

describe('ChatStore', () => {
  const send = vi.fn();
  let store: ChatStore;

  beforeEach(() => {
    send.mockReset().mockReturnValue(of({ message: 'Ok', recipes: [], interaction_id: 'i-1' }));
    TestBed.configureTestingModule({ providers: [{ provide: ChatService, useValue: { send } }] });
    store = TestBed.inject(ChatStore);
  });

  it('keeps one conversation and continues it with the last interaction id', () => {
    store.send('Hej');
    store.send('  A obiad?  ');

    expect(send).toHaveBeenLastCalledWith('A obiad?', 'i-1');
    expect(store.entries().map((entry) => entry.text)).toEqual(['Hej', 'Ok', 'A obiad?', 'Ok']);
  });

  it('ignores blank messages', () => {
    store.send('   ');

    expect(send).not.toHaveBeenCalled();
  });

  it('reports a failed request and lets the user try again', () => {
    send.mockReturnValueOnce(throwError(() => new Error('502')));

    store.send('Hej');

    expect(store.errorMessage()).toContain('Nie udało się');
    expect(store.loading()).toBe(false);
  });

  it('starts a new conversation without the previous interaction id', () => {
    store.send('Hej');
    store.newConversation();
    store.send('Od nowa');

    expect(store.entries()).toHaveLength(2);
    expect(send).toHaveBeenLastCalledWith('Od nowa', null);
  });
});
