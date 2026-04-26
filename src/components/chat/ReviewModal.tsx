import React from 'react';
import { Modal, Tag, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import styled from 'styled-components';

interface Props {
  open: boolean;
  originalText: string;
  maskedText: string;
  provider: string;
  model: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ReviewModal = ({ open, originalText, maskedText, provider, model, onConfirm, onCancel }: Props) => {
  const hasChanges = originalText !== maskedText;

  return (
    <Modal
      title={
        <TitleRow>
          <EyeOutlined /> Review before sending
        </TitleRow>
      }
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Continue"
      cancelText="Cancel"
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
        <Label>{hasChanges ? 'After PII masking (this will be sent)' : 'Text to send'}</Label>
        <TextBlock>{maskedText}</TextBlock>
      </Section>

      {hasChanges && (
        <MaskingNote>
          PII redaction was applied. Review the masked text above to ensure no sensitive information remains before
          sending.
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
