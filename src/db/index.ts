import Dexie, { type EntityTable } from 'dexie';
import type { APILog } from './logs';

export interface Conversation {
  id: string;
  title: string;
  assistantId: string;
  threadId: string;
  tags: string[];
  temporary: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  author: 'user' | 'assistant' | 'system';
  text: string;
  createdAt: number;
}

class AppDatabase extends Dexie {
  conversations!: EntityTable<Conversation, 'id'>;
  messages!: EntityTable<ChatMessage, 'id'>;
  logs!: EntityTable<APILog, 'id'>;

  constructor() {
    super('vitalytics');

    this.version(1).stores({
      conversations: 'id, updatedAt, archived',
      messages: 'id, conversationId, createdAt',
    });

    this.version(2).stores({
      conversations: 'id, updatedAt, archived',
      messages: 'id, conversationId, createdAt',
      logs: 'id, conversationId, timestamp',
    });
  }
}

export const db = new AppDatabase();
