import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, of } from 'rxjs';

import { buildUser } from '../../../testing/user-fixtures';
import { ActiveUserService } from '../../core/active-user.service';
import { ChatStore } from '../../core/chat-store.service';
import { ChatService } from '../../core/chat.service';
import { ChatWidgetComponent } from './chat-widget.component';

@Component({ template: '' })
class EmptyPage {}

@Component({ imports: [ChatWidgetComponent], template: '<app-chat-widget />' })
class Shell {}

describe('ChatWidgetComponent', () => {
  const send = vi.fn();
  let harness: RouterTestingHarness;
  let element: HTMLElement;

  const fab = () => element.querySelector<HTMLButtonElement>('.fab');
  const panel = () => element.querySelector('[role="dialog"]');

  async function render(url: string): Promise<void> {
    harness = await RouterTestingHarness.create(url);
    const fixture = TestBed.createComponent(Shell);
    element = fixture.nativeElement;
    await fixture.whenStable();
    harness.fixture.autoDetectChanges();
    fixture.autoDetectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    send.mockReset().mockReturnValue(of({ message: 'Cześć!', recipes: [], interaction_id: 'i-1' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'recipes', component: EmptyPage },
          { path: 'chat', component: EmptyPage },
        ]),
        { provide: ChatService, useValue: { send } },
      ],
    });
    TestBed.inject(ActiveUserService).select(buildUser({ id: 'u1' }));
  });

  afterEach(() => localStorage.clear());

  it('opens and closes the chat panel from the floating button', async () => {
    await render('/recipes');
    expect(panel()).toBeNull();

    fab()!.click();
    await harness.fixture.whenStable();
    expect(panel()).not.toBeNull();
    expect(fab()!.getAttribute('aria-expanded')).toBe('true');

    fab()!.click();
    await harness.fixture.whenStable();
    expect(panel()).toBeNull();
  });

  it('moves focus to the message field when opened', async () => {
    await render('/recipes');

    fab()!.click();
    await harness.fixture.whenStable();

    expect(document.activeElement?.classList).toContain('composer-input');
  });

  it('closes on Escape', async () => {
    await render('/recipes');
    fab()!.click();
    await harness.fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await harness.fixture.whenStable();

    expect(panel()).toBeNull();
  });

  it('shares the conversation with the chat page', async () => {
    TestBed.inject(ChatStore).send('Hej');
    await render('/recipes');

    fab()!.click();
    await harness.fixture.whenStable();

    expect(panel()!.querySelector('.bubble.user')?.textContent).toContain('Hej');
    expect(panel()!.querySelector('.assistant .bubble')?.textContent).toContain('Cześć!');
  });

  it('marks the button while the assistant is answering', async () => {
    send.mockReturnValue(NEVER);
    TestBed.inject(ChatStore).send('Hej');
    await render('/recipes');

    expect(element.querySelector('.fab .busy')).not.toBeNull();
  });

  it('is hidden on the chat page', async () => {
    await render('/chat');

    expect(fab()).toBeNull();
  });

  it('is hidden when nobody is logged in', async () => {
    TestBed.inject(ActiveUserService).logout();
    await render('/recipes');

    expect(fab()).toBeNull();
  });
});
