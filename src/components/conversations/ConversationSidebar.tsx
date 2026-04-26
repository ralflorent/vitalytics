import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { Button, Tooltip, Popover, Popconfirm, Input, Tag, Dropdown, message } from 'antd';
import type { InputRef } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  TagOutlined,
  EditOutlined,
  EllipsisOutlined,
  ThunderboltOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { Conversation } from '../../db';
import { deleteConversation, updateConversation, clearAllConversations } from '../../db/conversations';
import { db } from '../../db';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface Props {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  temporary: boolean;
  onToggleTemporary: () => void;
  refreshKey: number;
}

const TAG_COLORS = ['blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'gold'];

const ConversationSidebar = ({ activeId, onSelect, onNewChat, temporary, onToggleTemporary, refreshKey }: Props) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagEditId, setTagEditId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<InputRef>(null);

  useEffect(() => {
    db.conversations.orderBy('updatedAt').reverse().toArray().then(setConversations);
  }, [refreshKey]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearAll = async () => {
    await clearAllConversations();
    setConversations([]);
    message.success('All conversations cleared.');
  };

  const handleAddTag = async (convId: string) => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    const conv = conversations.find((c) => c.id === convId);
    if (!conv || conv.tags.includes(tag)) {
      setTagInput('');
      return;
    }
    const newTags = [...conv.tags, tag];
    await updateConversation(convId, { tags: newTags });
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, tags: newTags } : c)));
    setTagInput('');
  };

  const handleRemoveTag = async (convId: string, tag: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    const newTags = conv.tags.filter((t) => t !== tag);
    await updateConversation(convId, { tags: newTags });
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, tags: newTags } : c)));
  };

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const commitRename = async () => {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      await updateConversation(renamingId, { title: trimmed });
      setConversations((prev) => prev.map((c) => (c.id === renamingId ? { ...c, title: trimmed } : c)));
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const buildMenuItems = (conv: Conversation): MenuProps['items'] => [
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: 'Rename',
      onClick: ({ domEvent }) => { domEvent.stopPropagation(); startRename(conv); },
    },
    {
      key: 'tags',
      icon: <TagOutlined />,
      label: 'Tags',
      onClick: ({ domEvent }) => { domEvent.stopPropagation(); setTagEditId(conv.id); },
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: ({ domEvent }) => { domEvent.stopPropagation(); handleDelete(domEvent as unknown as React.MouseEvent, conv.id); },
    },
  ];

  const tagPopoverContent = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    return (
      <TagPopover onClick={(e) => e.stopPropagation()}>
        <TagList>
          {conv?.tags.map((tag, i) => (
            <Tag
              key={tag}
              color={TAG_COLORS[i % TAG_COLORS.length]}
              closable
              onClose={() => handleRemoveTag(convId, tag)}
            >
              {tag}
            </Tag>
          ))}
        </TagList>
        <Input
          size="small"
          placeholder="Add tag..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onPressEnter={() => handleAddTag(convId)}
          style={{ marginTop: conv?.tags.length ? 6 : 0 }}
        />
      </TagPopover>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Button type="primary" icon={<PlusOutlined />} onClick={onNewChat} style={{ flex: 1 }}>
          New Chat
        </Button>
        <Tooltip title={temporary ? 'Disable temporary chat' : 'Enable temporary chat'}>
          <TempToggle $active={temporary} onClick={onToggleTemporary}>
            <ThunderboltOutlined />
          </TempToggle>
        </Tooltip>
      </SidebarHeader>
      <ConversationList>
        {conversations.map((conv) => (
          <ConversationItem key={conv.id} $active={conv.id === activeId} onClick={() => onSelect(conv.id)}>
            <ItemContent>
              <TitleRow>
                {renamingId === conv.id ? (
                  <RenameInput
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onPressEnter={commitRename}
                    onBlur={commitRename}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                  />
                ) : (
                  <ItemTitle>{conv.title || 'Untitled conversation'}</ItemTitle>
                )}
                {conv.temporary && (
                  <TempBadge>
                    <ThunderboltOutlined /> Temp
                  </TempBadge>
                )}
              </TitleRow>
              {conv.tags.length > 0 && (
                <ItemTags>
                  {conv.tags.map((tag, i) => (
                    <MiniTag key={tag} $color={TAG_COLORS[i % TAG_COLORS.length]}>
                      {tag}
                    </MiniTag>
                  ))}
                </ItemTags>
              )}
              <ItemTime>{dayjs(conv.updatedAt).fromNow()}</ItemTime>
            </ItemContent>
            <Popover
              content={tagPopoverContent(conv.id)}
              trigger="click"
              open={tagEditId === conv.id}
              onOpenChange={(open) => {
                setTagEditId(open ? conv.id : null);
                if (!open) setTagInput('');
              }}
            >
              <span />
            </Popover>
            <ActionBtns>
              <Dropdown menu={{ items: buildMenuItems(conv) }} trigger={['click']} placement="bottomRight">
                <ActionBtn
                  type="text"
                  size="small"
                  icon={<EllipsisOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </ActionBtns>
          </ConversationItem>
        ))}
        {conversations.length === 0 && <EmptyState>No conversations yet. Start a new chat!</EmptyState>}
      </ConversationList>
      {conversations.length > 0 && (
        <SidebarFooter>
          <Popconfirm
            title="Clear all conversations?"
            description="This will permanently delete all chats, messages, and logs."
            onConfirm={handleClearAll}
            okText="Clear all"
            okButtonProps={{ danger: true }}
          >
            <ClearBtn type="text" size="small" icon={<ClearOutlined />}>
              Clear all
            </ClearBtn>
          </Popconfirm>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--color-bg);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 6px;
  height: 48px;

  .ant-btn {
    height: 32px;
    font-size: 14px;
  }
`;

const TempToggle = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid ${(p) => (p.$active ? '#f59e0b' : 'var(--color-border)')};
  background: ${(p) => (p.$active ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-surface)')};
  color: ${(p) => (p.$active ? '#b45309' : 'var(--color-text-secondary)')};
  cursor: pointer;
  font-size: 15px;
  flex-shrink: 0;
  transition: all 150ms ease;

  &:hover {
    border-color: #f59e0b;
    color: #b45309;
    background: rgba(245, 158, 11, 0.1);
  }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const ConversationItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 120ms ease-in-out;
  background: ${(p) => (p.$active ? 'var(--color-primary-surface)' : 'transparent')};
  border-left: 3px solid ${(p) => (p.$active ? 'var(--color-primary)' : 'transparent')};

  &:hover {
    background: ${(p) => (p.$active ? 'var(--color-primary-surface)' : 'var(--color-surface-elevated)')};
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }
`;

const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ItemTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const TempBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
  flex-shrink: 0;
  white-space: nowrap;
`;

const ItemTags = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 3px;
  flex-wrap: wrap;
`;

const MiniTag = styled.span<{ $color: string }>`
  font-size: 10px;
  padding: 0 5px;
  border-radius: 3px;
  background: ${(p) => {
    const map: Record<string, string> = {
      blue: 'rgba(24,144,255,0.12)',
      green: 'rgba(82,196,26,0.12)',
      orange: 'rgba(250,173,20,0.12)',
      purple: 'rgba(114,46,209,0.12)',
      cyan: 'rgba(19,194,194,0.12)',
      magenta: 'rgba(235,47,150,0.12)',
      gold: 'rgba(250,173,20,0.12)',
    };
    return map[p.$color] || map.blue;
  }};
  color: ${(p) => {
    const map: Record<string, string> = {
      blue: '#1890ff',
      green: '#52c41a',
      orange: '#fa8c16',
      purple: '#722ed1',
      cyan: '#13c2c2',
      magenta: '#eb2f96',
      gold: '#faad14',
    };
    return map[p.$color] || map.blue;
  }};
`;

const ItemTime = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
`;

const RenameInput = styled(Input)`
  flex: 1;
  min-width: 0;
`;

const ActionBtns = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  flex-shrink: 0;
  ${ConversationItem}:hover & {
    opacity: 1;
  }
`;

const ActionBtn = styled(Button)``;

const EmptyState = styled.div`
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
  padding: 32px 16px;
`;

const SidebarFooter = styled.div`
  padding: 6px 12px;
  min-height: 36px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ClearBtn = styled(Button)`
  font-size: 12px;
  color: var(--color-text-muted) !important;
`;

const TagPopover = styled.div`
  width: 180px;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

export default ConversationSidebar;
