import React from 'react';
import { Dropdown, Button, message } from 'antd';
import {
  ExportOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  CodeOutlined,
  CopyOutlined,
  ShareAltOutlined,
  MailOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { Conversation, ChatMessage } from '../../db';
import {
  toMarkdown,
  toJson,
  toPlainText,
  downloadText,
  copyToClipboard,
  shareContent,
} from '../../utils/export';

interface Props {
  conversation: Conversation | null;
  messages: ChatMessage[];
}

const ExportMenu = ({ conversation, messages }: Props) => {
  if (!conversation || messages.length === 0) return null;

  const slug = conversation.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40);

  const items: MenuProps['items'] = [
    {
      key: 'md',
      icon: <FileMarkdownOutlined />,
      label: 'Download as Markdown',
      onClick: () => {
        downloadText(toMarkdown(conversation, messages), `${slug}.md`, 'text/markdown');
        message.success('Exported as Markdown');
      },
    },
    {
      key: 'txt',
      icon: <FileTextOutlined />,
      label: 'Download as Text',
      onClick: () => {
        downloadText(toPlainText(conversation, messages), `${slug}.txt`, 'text/plain');
        message.success('Exported as Text');
      },
    },
    {
      key: 'json',
      icon: <CodeOutlined />,
      label: 'Download as JSON',
      onClick: () => {
        downloadText(toJson(conversation, messages), `${slug}.json`, 'application/json');
        message.success('Exported as JSON');
      },
    },
    { type: 'divider' },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: 'Copy to clipboard',
      onClick: async () => {
        const ok = await copyToClipboard(toPlainText(conversation, messages));
        if (ok) {
          message.success('Copied to clipboard');
        } else {
          message.error('Failed to copy');
        }
      },
    },
    ...('share' in navigator
      ? [
          {
            key: 'share',
            icon: <ShareAltOutlined />,
            label: 'Share...',
            onClick: async () => {
              await shareContent(conversation.title, toPlainText(conversation, messages));
            },
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'email',
      icon: <MailOutlined />,
      label: 'Send via Email',
      onClick: () => {
        const subject = encodeURIComponent(conversation.title);
        const body = encodeURIComponent(toPlainText(conversation, messages));
        window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
      },
    },
    {
      key: 'whatsapp',
      icon: <MessageOutlined />,
      label: 'Send via WhatsApp',
      onClick: () => {
        const text = encodeURIComponent(toPlainText(conversation, messages));
        window.open(`https://wa.me/?text=${text}`, '_blank');
      },
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button type="text" icon={<ExportOutlined />} size="small">
        Export
      </Button>
    </Dropdown>
  );
};

export default ExportMenu;
