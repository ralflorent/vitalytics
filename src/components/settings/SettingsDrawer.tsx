import React, { useState, useEffect } from 'react';
import { Drawer, Input, Select, Button, Tag, Switch, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  BgColorsOutlined,
  RobotOutlined,
  SafetyOutlined,
  KeyOutlined,
  SoundOutlined,
  DatabaseOutlined,
  UserOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { getAllProviders, getProvider, setProviderKey, removeProviderKey } from '../../providers/registry';
import type { ThemeMode } from '../../hooks/useTheme';
import { db } from '../../db';
import { AGE_RANGES, BACKGROUNDS, INTEREST_OPTIONS, type UserProfile, saveProfile } from '../../types/profile';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (modelId: string) => void;
  maskingLevel: string;
  onMaskingLevelChange: (level: string) => void;
  reviewBeforeSend: boolean;
  onReviewBeforeSendChange: (enabled: boolean) => void;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  tone: string;
  onToneChange: (tone: string) => void;
  detailLevel: string;
  onDetailLevelChange: (level: string) => void;
  userProfile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

const SettingsDrawer = ({
  open,
  onClose,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  maskingLevel,
  onMaskingLevelChange,
  reviewBeforeSend,
  onReviewBeforeSendChange,
  themeMode,
  onThemeModeChange,
  tone,
  onToneChange,
  detailLevel,
  onDetailLevelChange,
  userProfile,
  onProfileChange,
}: Props) => {
  const providers = getAllProviders();
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const inputs: Record<string, string> = {};
    for (const p of providers) {
      const saved = localStorage.getItem(`provider_key_${p.id}`);
      inputs[p.id] = saved || '';
    }
    setKeyInputs(inputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleExportAll = async () => {
    const [conversations, messages, logs] = await Promise.all([
      db.conversations.toArray(),
      db.messages.toArray(),
      db.logs.toArray(),
    ]);
    const data = { exportedAt: new Date().toISOString(), conversations, messages, logs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitalytics-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Data exported successfully.');
  };

  const handleSaveKey = (providerId: string) => {
    const key = keyInputs[providerId]?.trim();
    if (!key) {
      removeProviderKey(providerId);
      message.info(`${getProvider(providerId)?.name} key removed.`);
    } else {
      setProviderKey(providerId, key);
      message.success(`${getProvider(providerId)?.name} key saved.`);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updates };
    saveProfile(updated);
    onProfileChange(updated);
  };

  const toggleInterest = (interest: string) => {
    const interests = userProfile.interests.includes(interest)
      ? userProfile.interests.filter((i) => i !== interest)
      : [...userProfile.interests, interest];
    updateProfile({ interests });
  };

  const currentProvider = getProvider(selectedProvider);
  const models = currentProvider?.models || [];

  return (
    <Drawer
      title="Settings"
      placement="right"
      width={400}
      onClose={onClose}
      open={open}
      styles={{ body: { background: 'var(--color-surface-elevated)' } }}
    >

      <Section>
        <SectionTitle>
          <RobotOutlined /> AI Provider
        </SectionTitle>
        <SectionHint>Select the provider and model for your analysis</SectionHint>
        <Select
          value={selectedProvider}
          onChange={onProviderChange}
          style={{ width: '100%' }}
          options={providers.map((p) => ({
            value: p.id,
            label: (
              <ProviderOption>
                {p.name}
                {p.isConfigured() ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Ready
                  </Tag>
                ) : (
                  <Tag color="default" icon={<CloseCircleOutlined />}>
                    No key
                  </Tag>
                )}
              </ProviderOption>
            ),
          }))}
        />
        <SettingRow>
          <SettingLabel>Model</SettingLabel>
          <Select
            value={selectedModel}
            onChange={onModelChange}
            style={{ width: '100%' }}
            optionLabelProp="selectedLabel"
          >
            <Select.Option key="auto" value="auto" selectedLabel="Auto">
              <ModelOption>
                Auto
                <TierTag $tier="auto">agentic</TierTag>
              </ModelOption>
            </Select.Option>
            {models.map((m) => (
              <Select.Option key={m.id} value={m.id} selectedLabel={m.name}>
                <ModelOption>
                  {m.name}
                  <TierTag $tier={m.tier}>{m.tier}</TierTag>
                </ModelOption>
              </Select.Option>
            ))}
          </Select>
          <FieldHint>
            {selectedModel === 'auto'
              ? 'Automatically picks the best model per message — fast for simple queries, reasoning for complex ones.'
              : 'Fast models respond quickly. Reasoning models are slower but more thorough.'}
          </FieldHint>
        </SettingRow>
      </Section>

      <Section>
        <SectionTitle>
          <KeyOutlined /> API Keys
        </SectionTitle>
        <KeyHint>Your keys are stored in this browser only and never sent to our servers.</KeyHint>
        {providers.map((p) => (
          <KeyRow key={p.id}>
            <KeyLabel>{p.name}</KeyLabel>
            <KeyInputRow>
              <Input.Password
                value={keyInputs[p.id] || ''}
                onChange={(e) => setKeyInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                placeholder={`Enter ${p.name} API key`}
                style={{ flex: 1 }}
              />
              <Button type="primary" size="small" onClick={() => handleSaveKey(p.id)}>
                Save
              </Button>
            </KeyInputRow>
          </KeyRow>
        ))}
      </Section>

      <Section>
        <SectionTitle>
          <SoundOutlined /> Voice & Tone
        </SectionTitle>
        <SectionHint>Customize how the AI communicates with you</SectionHint>
        <SettingRow>
          <SettingLabel>Tone</SettingLabel>
          <Select
            value={tone}
            onChange={onToneChange}
            style={{ width: '100%' }}
            options={[
              { value: 'professional', label: 'Professional (clear and clinical)' },
              { value: 'friendly', label: 'Friendly (warm and approachable)' },
              { value: 'simple', label: 'Simple (plain language, avoid jargon)' },
            ]}
          />
        </SettingRow>
        <SettingRow>
          <SettingLabel>Detail level</SettingLabel>
          <Select
            value={detailLevel}
            onChange={onDetailLevelChange}
            style={{ width: '100%' }}
            options={[
              { value: 'brief', label: 'Brief (short, to the point)' },
              { value: 'standard', label: 'Standard (balanced explanations)' },
              { value: 'detailed', label: 'Detailed (thorough with context)' },
            ]}
          />
        </SettingRow>
      </Section>

      <Section>
        <SectionTitle>
          <SafetyOutlined /> Privacy & Data Control
        </SectionTitle>
        <SectionHint>Control what data leaves your browser</SectionHint>
        <SettingRow>
          <SettingLabel>PII Masking Level</SettingLabel>
          <Select
            value={maskingLevel}
            onChange={onMaskingLevelChange}
            style={{ width: '100%' }}
            options={[
              { value: 'all', label: 'Mask all PII (best effort)' },
              { value: 'names', label: 'Mask names and emails only' },
              { value: 'none', label: 'No masking' },
            ]}
          />
        </SettingRow>
        <SettingRow>
          <SettingLabel>Review before sending</SettingLabel>
          <SwitchRow>
            <Switch checked={reviewBeforeSend} onChange={onReviewBeforeSendChange} />
            <SwitchLabel>
              {reviewBeforeSend ? 'Review what will be sent to AI before each message' : 'Send messages directly'}
            </SwitchLabel>
          </SwitchRow>
        </SettingRow>
      </Section>

      <Section>
        <SectionTitle>
          <UserOutlined /> Profile
        </SectionTitle>
        <SectionHint>Helps the AI tailor responses to your needs</SectionHint>
        <SettingRow>
          <SettingLabel>Nickname</SettingLabel>
          <Input
            value={userProfile.nickname}
            onChange={(e) => updateProfile({ nickname: e.target.value })}
            placeholder="How should you be addressed?"
          />
        </SettingRow>
        <SettingRow>
          <SettingLabel>Age range</SettingLabel>
          <Select
            value={userProfile.ageRange || undefined}
            onChange={(val) => updateProfile({ ageRange: val })}
            allowClear
            placeholder="Select"
            style={{ width: '100%' }}
            options={AGE_RANGES}
          />
        </SettingRow>
        <SettingRow>
          <SettingLabel>Background</SettingLabel>
          <Select
            value={userProfile.background || undefined}
            onChange={(val) => updateProfile({ background: val })}
            allowClear
            placeholder="Select"
            style={{ width: '100%' }}
            options={BACKGROUNDS}
          />
        </SettingRow>
        <SettingRow>
          <SettingLabel>Areas of interest</SettingLabel>
          <InterestTags>
            {INTEREST_OPTIONS.map((interest) => (
              <Tag.CheckableTag
                key={interest}
                checked={userProfile.interests.includes(interest)}
                onChange={() => toggleInterest(interest)}
              >
                {interest}
              </Tag.CheckableTag>
            ))}
          </InterestTags>
        </SettingRow>
      </Section>

      <Section>
        <SectionTitle>
          <BgColorsOutlined /> Appearance
        </SectionTitle>
        <SectionHint>Choose how the app looks</SectionHint>
        <SettingRow>
          <SettingLabel>Theme</SettingLabel>
          <Select
            value={themeMode}
            onChange={(val) => onThemeModeChange(val as ThemeMode)}
            style={{ width: '100%' }}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </SettingRow>
      </Section>

      <Section>
        <SectionTitle>
          <DatabaseOutlined /> Data
        </SectionTitle>
        <SectionHint>Export all your conversations, messages, and API logs</SectionHint>
        <SettingRow>
          <SettingLabel>Storage limit</SettingLabel>
          <Select
            value={localStorage.getItem('storage_unlimited') === 'true' ? 'unlimited' : '4gb'}
            onChange={(val) => localStorage.setItem('storage_unlimited', String(val === 'unlimited'))}
            style={{ width: '100%' }}
            options={[
              { value: '4gb', label: '4 GB (default)' },
              { value: 'unlimited', label: 'Unlimited (full browser quota)' },
            ]}
          />
        </SettingRow>
        <Button block onClick={handleExportAll}>
          Export all data (JSON)
        </Button>
      </Section>
    </Drawer>
  );
};

const Section = styled.div`
  background: var(--color-surface);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 10px;
`;

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 8px;

  .anticon {
    color: var(--color-primary);
    font-size: 16px;
  }
`;

const SectionHint = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 14px;
`;

const FieldHint = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 4px;
  line-height: 1.4;
`;

const SettingRow = styled.div`
  margin-bottom: 14px;
`;

const SettingLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
`;

const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SwitchLabel = styled.span`
  font-size: 13px;
  color: var(--color-text-secondary);
`;

const KeyHint = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
`;

const ProviderOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const ModelOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const tierColors: Record<string, { bg: string; fg: string }> = {
  fast: { bg: '#CCFBF1', fg: '#0F766E' },
  reasoning: { bg: '#FEF3C7', fg: '#B45309' },
  auto: { bg: '#EDE9FE', fg: '#6D28D9' },
};

const TierTag = styled.span<{ $tier: string }>`
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: ${(p) => tierColors[p.$tier]?.bg || '#F1F5F9'};
  color: ${(p) => tierColors[p.$tier]?.fg || '#475569'};
`;

const InterestTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .ant-tag-checkable {
    border-radius: 6px;
    padding: 2px 10px;
    font-size: 12px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--color-primary);
    }
  }

  .ant-tag-checkable-checked {
    background: var(--color-primary-surface);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`;

const KeyRow = styled.div`
  margin-bottom: 12px;
`;

const KeyLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
`;

const KeyInputRow = styled.div`
  display: flex;
  gap: 8px;
`;

export default SettingsDrawer;
