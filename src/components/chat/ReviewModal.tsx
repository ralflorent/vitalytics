import React, { useState } from 'react';
import { Modal, Tag, Space, Input } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

interface Props {
  open: boolean;
  originalText: string;
  maskedText: string;
  maskingLevel: string;
  provider: string;
  model: string;
  onConfirm: (textToSend: string) => void;
  onCancel: () => void;
}

const ReviewModal = ({
  open,
  originalText,
  maskedText,
  maskingLevel,
  provider,
  model,
  onConfirm,
  onCancel,
}: Props) => {
  const [draft, setDraft] = useState(maskedText);
  const hasChanges = originalText !== maskedText;
  const trimmed = draft.trim();
  const canContinue = trimmed.length > 0;

  const handleOk = () => {
    if (!canContinue) return;
    onConfirm(trimmed);
  };

  return (
    <Modal
      title={
        <TitleRow>
          <EyeOutlined /> Review before sending
        </TitleRow>
      }
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Continue"
      cancelText="Cancel"
      okButtonProps={{ disabled: !canContinue }}
      width={560}
    >
      <MetaRow>
        <Space>
          <Tag color="processing">{provider}</Tag>
          <Tag>{model}</Tag>
        </Space>
      </MetaRow>

      {hasChanges && (
        <Section>
          <Label>Original text</Label>
          <TextBlock $muted>{originalText}</TextBlock>
        </Section>
      )}

      <Section>
        <Label>{hasChanges ? 'After PII masking (edit before sending)' : 'Text to send'}</Label>
        <OutgoingTextArea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoSize={{ minRows: 4, maxRows: 12 }}
        />
        {maskingLevel !== 'none' && (
          <RemaskingHint>
            Continue applies PII masking again to anything you type or paste here.
          </RemaskingHint>
        )}
      </Section>

      {hasChanges && (
        <MaskingNote>
          PII redaction was applied. Review and edit the text above to ensure nothing sensitive remains before sending.
        </MaskingNote>
      )}
    </Modal>
  );
};

const TitleRow = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MetaRow = styled.div`
  margin-bottom: 16px;
`;

const Section = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
`;

const TextBlock = styled.pre<{ $muted?: boolean }>`
  background: ${(p) => (p.$muted ? 'var(--color-surface-elevated)' : 'var(--color-primary-surface)')};
  border: 1px solid ${(p) => (p.$muted ? 'var(--color-border)' : 'var(--color-bubble-user-border)')};
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  color: ${(p) => (p.$muted ? 'var(--color-text-muted)' : 'var(--color-text)')};
  ${(p) => p.$muted && 'text-decoration: line-through;'}
`;

const OutgoingTextArea = styled(Input.TextArea)`
  && textarea {
    min-height: 120px;
    max-height: 200px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.5;
    background: var(--color-primary-surface);
    color: var(--color-text);
    border-color: var(--color-bubble-user-border);
    border-radius: 8px;
    padding: 12px;
    resize: vertical;
  }
`;

const RemaskingHint = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
`;

const MaskingNote = styled.div`
  font-size: 12px;
  color: var(--color-accent);
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 6px;
  padding: 8px 12px;
  line-height: 1.4;
`;

export default ReviewModal;
