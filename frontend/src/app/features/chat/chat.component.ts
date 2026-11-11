import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ChatThreadComponent } from './chat-thread/chat-thread.component';

/** Czat na pełnym ekranie; rozmowa jest wspólna z pływającym okienkiem (`ChatStore`). */
@Component({
  selector: 'app-chat',
  imports: [ChatThreadComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {}
