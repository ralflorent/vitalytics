import { db } from './index';
import type { Conversation, ChatMessage } from './index';

export async function createConversation(
  params: Pick<Conversation, 'title' | 'assistantId'> & { temporary?: boolean }
): Promise<Conversation> {
  const now = Date.now();
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    title: params.title,
    assistantId: params.assistantId,
    threadId: '',
    tags: [],
    temporary: params.temporary ?? false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.conversations.add(conversation);
  return conversation;
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  return db.conversations.get(id);
}

export async function listConversations(): Promise<Conversation[]> {
  return db.conversations
    .where('archived')
    .equals(0) // Dexie stores booleans as 0/1
    .reverse()
    .sortBy('updatedAt');
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<Conversation, 'title' | 'threadId' | 'tags' | 'archived' | 'temporary'>>
): Promise<void> {
  await db.conversations.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deleteConversation(id: string): Promise<void> {
  await db.transaction('rw', [db.conversations, db.messages], async () => {
    await db.messages.where('conversationId').equals(id).delete();
    await db.conversations.delete(id);
  });
}

export async function addMessage(
  conversationId: string,
  author: ChatMessage['author'],
  text: string
): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    conversationId,
    author,
    text,
    createdAt: Date.now(),
  };
  await db.messages.add(message);
  await db.conversations.update(conversationId, { updatedAt: Date.now() });
  return message;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  return db.messages
    .where('conversationId')
    .equals(conversationId)
    .sortBy('createdAt');
}

export async function clearAllConversations(): Promise<void> {
  await db.transaction('rw', [db.conversations, db.messages, db.logs], async () => {
    await db.messages.clear();
    await db.logs.clear();
    await db.conversations.clear();
  });
}

export interface StorageStats {
  conversations: number;
  messages: number;
  logs: number;
  usageBytes: number | null;
  quotaBytes: number | null;
}

export async function getStorageStats(): Promise<StorageStats> {
  const [conversations, messages, logs] = await Promise.all([
    db.conversations.count(),
    db.messages.count(),
    db.logs.count(),
  ]);

  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;
  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    usageBytes = estimate.usage ?? null;
    quotaBytes = estimate.quota ?? null;
  }

  return { conversations, messages, logs, usageBytes, quotaBytes };
}

export async function deleteTemporaryConversations(): Promise<void> {
  const temps = await db.conversations.filter((c) => c.temporary).toArray();
  const ids = temps.map((c) => c.id);
  if (ids.length === 0) return;
  await db.transaction('rw', [db.conversations, db.messages, db.logs], async () => {
    for (const id of ids) {
      await db.messages.where('conversationId').equals(id).delete();
      await db.logs.where('conversationId').equals(id).delete();
    }
    await db.conversations.bulkDelete(ids);
  });
}
