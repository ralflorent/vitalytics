import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal, Input, Button } from 'antd';
import { UserOutlined, MedicineBoxOutlined, StarOutlined } from '@ant-design/icons';
import {
  AGE_RANGES,
  BACKGROUNDS,
  INTEREST_OPTIONS,
  EMPTY_PROFILE,
  saveProfile,
  type UserProfile,
} from '../../types/profile';

interface Props {
  open: boolean;
  onComplete: (profile: UserProfile) => void;
}

const TOTAL_STEPS = 3;

const OnboardingWizard = ({ open, onComplete }: Props) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({ ...EMPTY_PROFILE });

  const finish = (finalProfile: UserProfile) => {
    saveProfile(finalProfile);
    localStorage.setItem('onboarding_complete', 'true');
    onComplete(finalProfile);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      finish(profile);
    }
  };

  const handleSkipStep = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      finish(profile);
    }
  };

  const handleSkipAll = () => {
    finish({ ...EMPTY_PROFILE });
  };

  const toggleInterest = (interest: string) => {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  return (
    <Modal open={open} closable={false} maskClosable={false} footer={null} width={480} centered>
      <Content>
        <StepIndicator>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <Dot key={i} $active={i + 1 === step} $done={i + 1 < step} />
          ))}
        </StepIndicator>

        {step === 1 && (
          <StepContent>
            <StepIcon>
              <UserOutlined />
            </StepIcon>
            <StepTitle>How should we address you?</StepTitle>
            <StepHint>This helps personalize your experience.</StepHint>

            <FieldLabel>Nickname</FieldLabel>
            <Input
              placeholder="e.g. Alex, Dr. Smith"
              value={profile.nickname}
              onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))}
              size="large"
            />

            <FieldLabel>Age range</FieldLabel>
            <TagGroup>
              {AGE_RANGES.map((r) => (
                <SelectableTag
                  key={r.value}
                  $selected={profile.ageRange === r.value}
                  onClick={() => setProfile((p) => ({ ...p, ageRange: r.value }))}
                >
                  {r.label}
                </SelectableTag>
              ))}
            </TagGroup>
          </StepContent>
        )}

        {step === 2 && (
          <StepContent>
            <StepIcon>
              <MedicineBoxOutlined />
            </StepIcon>
            <StepTitle>What&apos;s your background?</StepTitle>
            <StepHint>This helps us adjust the level of detail and terminology.</StepHint>

            <TagGroup $vertical>
              {BACKGROUNDS.map((b) => (
                <SelectableTag
                  key={b.value}
                  $selected={profile.background === b.value}
                  $wide
                  onClick={() => setProfile((p) => ({ ...p, background: b.value }))}
                >
                  {b.label}
                </SelectableTag>
              ))}
            </TagGroup>
          </StepContent>
        )}

        {step === 3 && (
          <StepContent>
            <StepIcon>
              <StarOutlined />
            </StepIcon>
            <StepTitle>Any areas of interest?</StepTitle>
            <StepHint>Select topics you care about most. This helps refine responses.</StepHint>

            <TagGroup>
              {INTEREST_OPTIONS.map((interest) => (
                <SelectableTag
                  key={interest}
                  $selected={profile.interests.includes(interest)}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </SelectableTag>
              ))}
            </TagGroup>
          </StepContent>
        )}

        <Actions>
          <SkipBtn type="text" onClick={handleSkipStep}>
            Skip
          </SkipBtn>
          <RightActions>
            {step === 1 && (
              <SkipAllBtn type="text" onClick={handleSkipAll}>
                Skip all
              </SkipAllBtn>
            )}
            <Button type="primary" onClick={handleNext}>
              {step === TOTAL_STEPS ? 'Get started' : 'Continue'}
            </Button>
          </RightActions>
        </Actions>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  padding: 8px 0;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
`;

const Dot = styled.div<{ $active: boolean; $done: boolean }>`
  width: ${(p) => (p.$active ? '24px' : '8px')};
  height: 8px;
  border-radius: 4px;
  background: ${(p) =>
    p.$active ? 'var(--color-primary)' : p.$done ? 'var(--color-primary)' : 'var(--color-border)'};
  opacity: ${(p) => (p.$done ? 0.4 : 1)};
  transition: all 200ms ease;
`;

const StepContent = styled.div`
  min-height: 220px;
`;

const StepIcon = styled.div`
  text-align: center;
  font-size: 28px;
  color: var(--color-primary);
  margin-bottom: 8px;
`;

const StepTitle = styled.h3`
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px;
`;

const StepHint = styled.p`
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 20px;
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 14px 0 6px;
`;

const TagGroup = styled.div<{ $vertical?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  ${(p) => p.$vertical && 'flex-direction: column;'}
`;

const SelectableTag = styled.button<{ $selected: boolean; $wide?: boolean }>`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$selected ? 'var(--color-primary)' : 'var(--color-border)')};
  background: ${(p) => (p.$selected ? 'var(--color-primary-surface)' : 'var(--color-surface)')};
  color: ${(p) => (p.$selected ? 'var(--color-primary)' : 'var(--color-text-secondary)')};
  font-size: 13px;
  font-weight: ${(p) => (p.$selected ? 600 : 400)};
  cursor: pointer;
  transition: all 120ms ease;
  font-family: inherit;
  text-align: left;
  ${(p) => p.$wide && 'width: 100%;'}

  &:hover {
    border-color: var(--color-primary);
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
`;

const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SkipBtn = styled(Button)`
  color: var(--color-text-muted) !important;
  font-size: 13px;
`;

const SkipAllBtn = styled(Button)`
  color: var(--color-text-muted) !important;
  font-size: 13px;
`;

export default OnboardingWizard;
