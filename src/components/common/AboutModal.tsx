import React from 'react';
import styled from 'styled-components';
import { Modal } from 'antd';
import {
  SafetyOutlined,
  CloudOutlined,
  LockOutlined,
  FileTextOutlined,
  RobotOutlined,
  EyeInvisibleOutlined,
  ExportOutlined,
} from '@ant-design/icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

const AboutModal = ({ open, onClose }: Props) => (
  <Modal title={null} open={open} onCancel={onClose} footer={null} width={560} centered>
    <ModalHeader>
      <Logo src="/icons/icon.svg" alt="Vitalytics" />
      <AppName>Vitalytics</AppName>
      <Tagline>A smarter second look at your lab results</Tagline>
    </ModalHeader>

    <Section>
      <SectionTitle>
        Purpose
      </SectionTitle>
      <SectionText>
        Vitalytics helps you understand medical documents, lab results, and health data through AI-powered analysis.
        Upload or paste your health records and get clear, conversational explanations — all without leaving your
        browser.
      </SectionText>
    </Section>

    <Section>
      <SectionTitle>
        Key Features
      </SectionTitle>
      <FeatureGrid>
        <Feature>
          <RobotOutlined />
          <div>
            <FeatureName>Multi-provider AI</FeatureName>
            <FeatureDesc>Choose from OpenAI, Anthropic, or Google Gemini with streaming responses</FeatureDesc>
          </div>
        </Feature>
        <Feature>
          <FileTextOutlined />
          <div>
            <FeatureName>Document analysis</FeatureName>
            <FeatureDesc>
              Upload PDFs, images, or text files — content is extracted and analyzed automatically
            </FeatureDesc>
          </div>
        </Feature>
        <Feature>
          <EyeInvisibleOutlined />
          <div>
            <FeatureName>PII masking</FeatureName>
            <FeatureDesc>Optional redaction of personal identifiers before data reaches any AI provider</FeatureDesc>
          </div>
        </Feature>
        <Feature>
          <ExportOutlined />
          <div>
            <FeatureName>Export & share</FeatureName>
            <FeatureDesc>Download conversations as Markdown, JSON, or text — share via email or WhatsApp</FeatureDesc>
          </div>
        </Feature>
      </FeatureGrid>
    </Section>

    <Section>
      <SectionTitle>
        Privacy & Security
      </SectionTitle>
      <FeatureGrid>
        <Feature>
          <CloudOutlined />
          <div>
            <FeatureName>Browser-only architecture</FeatureName>
            <FeatureDesc>There is no backend server. All processing happens entirely on your device.</FeatureDesc>
          </div>
        </Feature>
        <Feature>
          <LockOutlined />
          <div>
            <FeatureName>Bring Your Own Key (BYOK)</FeatureName>
            <FeatureDesc>API keys are stored in your browser&apos;s local storage and never sent to us.</FeatureDesc>
          </div>
        </Feature>
        <Feature>
          <EyeInvisibleOutlined />
          <div>
            <FeatureName>No tracking or analytics</FeatureName>
            <FeatureDesc>We don&apos;t collect usage data, error reports, or any personal information.</FeatureDesc>
          </div>
        </Feature>
        <Feature>
          <SafetyOutlined />
          <div>
            <FeatureName>Your data stays yours</FeatureName>
            <FeatureDesc>
              Conversations live in IndexedDB. Nothing leaves your device except what you send to your chosen AI provider.
            </FeatureDesc>
          </div>
        </Feature>
      </FeatureGrid>
    </Section>

    <Section>
      <SectionTitle>
        About the Developer
      </SectionTitle>
      <SectionText>
        Vitalytics is built and maintained by <strong>Ralph Florent</strong> and <strong>Donald Lui</strong>, with the goal of making health information more accessible through technology. This project is open
        source and contributions are welcome.
      </SectionText>
      <DevLinks>
        <DevLink href="https://github.com/ralflorent/vitalytics" target="_blank" rel="noopener noreferrer">
          GitHub
        </DevLink>
        <DevDot>&middot;</DevDot>
        <DevLink href="https://medium.com/@ralflorent/the-story-behind-vitalytics-f37721d029b1" target="_blank" rel="noopener noreferrer">
          Story
        </DevLink>
      </DevLinks>
      <BuildInfo>
        v{__APP_VERSION__} &middot; Build {__BUILD_SHA__} &middot;{' '}
        {new Date(__BUILD_DATE__).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </BuildInfo>
    </Section>

    <Divider />

    <FooterNote>
      AI-generated responses are not medical advice. Always consult a qualified healthcare provider for diagnosis and
      treatment decisions.
    </FooterNote>
  </Modal>
);

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Logo = styled.img`
  width: 56px;
  height: 56px;
  margin-bottom: 8px;
`;

const AppName = styled.h2`
  color: var(--color-primary);
  font-size: 22px;
  font-weight: 700;
  margin: 0;
`;

const Tagline = styled.p`
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 4px 0 0;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;

  .anticon {
    color: var(--color-primary);
  }
`;

const SectionText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Feature = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;

  > .anticon {
    color: var(--color-primary);
    font-size: 18px;
    margin-top: 2px;
    flex-shrink: 0;
  }
`;

const FeatureName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
`;

const FeatureDesc = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
  margin-top: 1px;
`;

const DevLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
`;

const DevLink = styled.a`
  font-size: 13px;
  color: var(--color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const DevDot = styled.span`
  color: var(--color-text-muted);
  font-size: 12px;
`;

const BuildInfo = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: 16px 0;
`;

const FooterNote = styled.p`
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
  font-style: italic;
`;

export default AboutModal;
