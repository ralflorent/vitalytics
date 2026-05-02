import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import { SettingOutlined, BarChartOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import ConversationSidebar from './conversations/ConversationSidebar';
import ChatView from './chat/ChatView';
import ErrorBoundary from './common/ErrorBoundary';

const FirstRunDisclaimer = lazy(() => import('./common/FirstRunDisclaimer'));
const OnboardingWizard = lazy(() => import('./common/OnboardingWizard'));
const AboutModal = lazy(() => import('./common/AboutModal'));
const SettingsDrawer = lazy(() => import('./settings/SettingsDrawer'));
const UsageDashboard = lazy(() => import('./settings/UsageDashboard'));
import { loadProfile, type UserProfile } from '../types/profile';
import { initializeProviders, getProvider } from '../providers/registry';
import { useTheme } from '../hooks/useTheme';
import { deleteTemporaryConversations } from '../db/conversations';

const App = () => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [temporaryMode, setTemporaryMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [usageDashboardOpen, setUsageDashboardOpen] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState(() => localStorage.getItem('selected_provider') || 'openai');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('selected_model') || 'gpt-4o-mini');
  const [maskingLevel, setMaskingLevel] = useState(() => localStorage.getItem('masking_level') || 'all');
  const [reviewBeforeSend, setReviewBeforeSend] = useState(() => localStorage.getItem('review_before_send') === 'true');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(
    () => localStorage.getItem('disclaimer_accepted') === 'true',
  );
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => localStorage.getItem('onboarding_complete') === 'true',
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(loadProfile);
  const [tone, setTone] = useState(() => localStorage.getItem('ai_tone') || 'professional');
  const [detailLevel, setDetailLevel] = useState(() => localStorage.getItem('ai_detail') || 'standard');
  const { mode: themeMode, effective: effectiveTheme, setThemeMode } = useTheme();

  // Initialize providers and clean up temporary chats from prior sessions
  useEffect(() => {
    initializeProviders();
    deleteTemporaryConversations().then(() => setRefreshKey((k) => k + 1));
  }, []);

  const handleMaskingLevelChange = useCallback((level: string) => {
    setMaskingLevel(level);
    localStorage.setItem('masking_level', level);
  }, []);

  const handleReviewBeforeSendChange = useCallback((enabled: boolean) => {
    setReviewBeforeSend(enabled);
    localStorage.setItem('review_before_send', String(enabled));
  }, []);

  const handleAcceptDisclaimer = useCallback(() => {
    setDisclaimerAccepted(true);
    localStorage.setItem('disclaimer_accepted', 'true');
  }, []);

  const handleOnboardingComplete = useCallback((profile: UserProfile) => {
    setOnboardingComplete(true);
    setUserProfile(profile);
  }, []);

  const handleProviderChange = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    localStorage.setItem('selected_provider', providerId);
    if (selectedModel !== 'auto') {
      const provider = getProvider(providerId);
      if (provider && provider.models.length > 0) {
        const defaultModel = provider.models[0].id;
        setSelectedModel(defaultModel);
        localStorage.setItem('selected_model', defaultModel);
      }
    }
  }, [selectedModel]);

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('selected_model', modelId);
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleToggleTemporary = useCallback(() => {
    setTemporaryMode((prev) => !prev);
  }, []);

  const handleConversationCreated = useCallback((id: string) => {
    setActiveConversationId(id);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: effectiveTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#0D9488',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <ErrorBoundary>
        <Shell>
          {sidebarOpen && <MobileBackdrop onClick={() => setSidebarOpen(false)} />}
          <SidebarArea $open={sidebarOpen}>
            <ConversationSidebar
              activeId={activeConversationId}
              onSelect={(id) => {
                setActiveConversationId(id);
                // Auto-close sidebar on mobile after selection
                if (window.innerWidth <= 767) setSidebarOpen(false);
              }}
              onNewChat={() => {
                handleNewChat();
                if (window.innerWidth <= 767) setSidebarOpen(false);
              }}
              temporary={temporaryMode}
              onToggleTemporary={handleToggleTemporary}
              refreshKey={refreshKey}
            />
          </SidebarArea>
          <MainArea>
            <TopBar>
              <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? '\u25C0' : '\u2630'}</MenuButton>
              <LogoLink>
                <LogoIcon src="/icons/logo-inline.svg" alt="Vitalytics" />
                <AppTitle>Vitalytics</AppTitle>
              </LogoLink>
              <Spacer />
              <ProviderBadge>
                {getProvider(selectedProvider)?.name} / {selectedModel === 'auto' ? 'Auto' : selectedModel}
              </ProviderBadge>
              <TopBarButton onClick={() => setUsageDashboardOpen(true)} title="Token usage">
                <BarChartOutlined />
              </TopBarButton>
              <TopBarButton onClick={() => setSettingsOpen(true)} title="Settings">
                <SettingOutlined />
              </TopBarButton>
            </TopBar>
            <ChatView
              conversationId={activeConversationId}
              providerId={selectedProvider}
              modelId={selectedModel}
              maskingLevel={maskingLevel}
              reviewBeforeSend={reviewBeforeSend}
              tone={tone}
              detailLevel={detailLevel}
              temporary={temporaryMode}
              userProfile={userProfile}
              onConversationCreated={handleConversationCreated}
            />
          </MainArea>
          <Footer>
            <Disclaimer>
              <strong>Important:</strong> Not a substitute for professional medical advice. AI responses may be
              inaccurate. Data processed in-browser only.
            </Disclaimer>
            <FooterBottom>
              <Copyright>&copy; {new Date().getFullYear()} Vitalytics</Copyright>
              <FooterDot>&middot;</FooterDot>
              <FooterLink onClick={() => setAboutOpen(true)}>Terms of Use</FooterLink>
            </FooterBottom>
          </Footer>
        </Shell>
        <Suspense fallback={null}>
          <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
        </Suspense>
        <Suspense fallback={null}>
          <UsageDashboard open={usageDashboardOpen} onClose={() => setUsageDashboardOpen(false)} />
        </Suspense>
        <Suspense fallback={null}>
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
          maskingLevel={maskingLevel}
          onMaskingLevelChange={handleMaskingLevelChange}
          reviewBeforeSend={reviewBeforeSend}
          onReviewBeforeSendChange={handleReviewBeforeSendChange}
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          tone={tone}
          onToneChange={(v: string) => {
            setTone(v);
            localStorage.setItem('ai_tone', v);
          }}
          detailLevel={detailLevel}
          onDetailLevelChange={(v: string) => {
            setDetailLevel(v);
            localStorage.setItem('ai_detail', v);
          }}
          userProfile={userProfile}
          onProfileChange={setUserProfile}
        />
        </Suspense>
        <Suspense fallback={null}>
          <FirstRunDisclaimer open={!disclaimerAccepted} onAccept={handleAcceptDisclaimer} />
        </Suspense>
        <Suspense fallback={null}>
          <OnboardingWizard
            open={disclaimerAccepted && !onboardingComplete}
            onComplete={handleOnboardingComplete}
          />
        </Suspense>
      </ErrorBoundary>
    </ConfigProvider>
  );
};

const Shell = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    'sidebar main'
    'sidebar footer';
  height: 100vh;
  overflow: hidden;

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'main'
      'footer';
  }
`;

const MobileBackdrop = styled.div`
  display: none;

  @media (max-width: 767px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 99;
    background: rgba(0, 0, 0, 0.35);
  }
`;

const SidebarArea = styled.div<{ $open: boolean }>`
  grid-area: sidebar;
  width: ${(p) => (p.$open ? '300px' : '0px')};
  overflow: hidden;
  transition: width 200ms ease-out;

  @media (max-width: 767px) {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    width: ${(p) => (p.$open ? '280px' : '0px')};
    box-shadow: ${(p) => (p.$open ? '4px 0 12px rgba(0,0,0,0.1)' : 'none')};
  }
`;

const MainArea = styled.div`
  grid-area: main;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
  height: 48px;
`;

const MenuButton = styled.button`
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-secondary);
  &:hover {
    background: var(--color-surface-elevated);
  }
`;

const LogoLink = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoIcon = styled.img`
  width: 28px;
  height: 28px;
`;

const AppTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
  white-space: nowrap;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const ProviderBadge = styled.span`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-accent-badge-text);
  padding: 4px 10px;
  background: var(--color-accent-badge-bg);
  border: 1px solid var(--color-accent-badge-border);
  border-radius: 6px;
  white-space: nowrap;

  @media (max-width: 480px) {
    display: none;
  }
`;

const TopBarButton = styled.button`
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  color: var(--color-text-secondary);
  &:hover {
    background: var(--color-surface-elevated);
  }
`;

const Footer = styled.footer`
  grid-area: footer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 16px 10px 16px;
  min-height: 36px;
  background: var(--color-bg);
  gap: 2px;
`;

const Disclaimer = styled.p`
  text-align: center;
  font-size: 11px;
  color: var(--color-text-muted);
  max-width: 680px;
  line-height: 1.4;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 10px;
    padding: 0 8px;
  }
`;

const FooterBottom = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Copyright = styled.span`
  font-size: 11px;
  color: var(--color-text-muted);
  opacity: 0.7;
`;

const FooterDot = styled.span`
  font-size: 11px;
  color: var(--color-text-muted);
  opacity: 0.5;
`;

const FooterLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: var(--color-primary);
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  opacity: 0.8;

  &:hover {
    text-decoration: underline;
    opacity: 1;
  }
`;

export default App;
