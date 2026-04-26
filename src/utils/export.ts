import type { Conversation, ChatMessage } from '../db';

export function toMarkdown(conversation: Conversation, messages: ChatMessage[]): string {
  const lines: string[] = [
    `# ${conversation.title}`,
    '',
    `**Provider:** ${conversation.assistantId}`,
    `**Created:** ${new Date(conversation.createdAt).toLocaleString()}`,
    '',
    '---',
    '',
  ];

  for (const msg of messages) {
    const author = msg.author === 'user' ? '**You**' : '**Assistant**';
    const time = new Date(msg.createdAt).toLocaleString();
    lines.push(`### ${author} — ${time}`);
    lines.push('');
    lines.push(msg.text);
    lines.push('');
  }

  return lines.join('\n');
}

export function toJson(conversation: Conversation, messages: ChatMessage[]): string {
  return JSON.stringify({ conversation, messages }, null, 2);
}

export function toPlainText(conversation: Conversation, messages: ChatMessage[]): string {
  const lines: string[] = [
    conversation.title,
    `Provider: ${conversation.assistantId}`,
    `Created: ${new Date(conversation.createdAt).toLocaleString()}`,
    '',
    '---',
    '',
  ];

  for (const msg of messages) {
    const author = msg.author === 'user' ? 'You' : 'Assistant';
    const time = new Date(msg.createdAt).toLocaleString();
    lines.push(`[${author}] ${time}`);
    lines.push(msg.text);
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadText(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareContent(title: string, text: string): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false;
  }
}
