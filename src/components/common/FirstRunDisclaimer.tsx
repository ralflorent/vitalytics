import React from 'react';
import { Modal, Button } from 'antd';
import {
  ExclamationCircleOutlined,
  LockOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

interface Props {
  open: boolean;
  onAccept: () => void;
}

const FirstRunDisclaimer = ({ open, onAccept }: Props) => {
  return (
    <Modal
      open={open}
      closable={false}
      maskClosable={false}
      footer={null}
      width={520}
      centered
    >
      <Content>
        <Title>Welcome to Vitalytics</Title>
        <Subtitle>Before you begin, please understand how this app works:</Subtitle>

        <Item>
          <MedicineBoxOutlined style={{ fontSize: 20, color: '#0D9488' }} />
          <div>
            <ItemTitle>Not medical advice</ItemTitle>
            <ItemText>
              AI-generated responses may be inaccurate or incomplete. Always consult a
              qualified healthcare provider for medical decisions.
            </ItemText>
          </div>
        </Item>

        <Item>
          <LockOutlined style={{ fontSize: 20, color: '#0D9488' }} />
          <div>
            <ItemTitle>Your data stays in your browser</ItemTitle>
            <ItemText>
              Documents and conversations are stored locally. When you send a message,
              the text is transmitted only to your chosen AI provider (OpenAI, Anthropic, etc.)
              using your own API key.
            </ItemText>
          </div>
        </Item>

        <Item>
          <ExclamationCircleOutlined style={{ fontSize: 20, color: '#F59E0B' }} />
          <div>
            <ItemTitle>PII masking is best-effort</ItemTitle>
            <ItemText>
              The app attempts to redact personal identifiers (names, emails, etc.) before
              sending data to the AI provider, but it may not catch all sensitive information
              such as medical record numbers or insurance IDs.
            </ItemText>
          </div>
        </Item>

        <AcceptButton type="primary" size="large" onClick={onAccept} block>
          I understand, let&apos;s get started
        </AcceptButton>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  padding: 8px 0;
`;

const Title = styled.h2`
  text-align: center;
  color: var(--color-primary);
  font-size: 22px;
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
`;

const Item = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: flex-start;
`;

const ItemTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text);
  margin-bottom: 2px;
`;

const ItemText = styled.div`
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
`;

const AcceptButton = styled(Button)`
  margin-top: 12px;
`;

export default FirstRunDisclaimer;
