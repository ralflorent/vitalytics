import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Spin, Tooltip, message } from 'antd';
import {
  PlusOutlined,
  CloseOutlined,
  FileTextOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { extractTextFromPdf, extractTextFromImage, readTextFile } from '../../utils';
import { printFileSize } from '../../shared';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

const MAX_ATTACHMENTS = 5;

interface Attachment {
  id: string;
  name: string;
  size: number;
  extractedText: string;
  processing: boolean;
  error?: string;
}

interface Props {
  onSend: (text: string, attachmentTexts: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  presets?: string[];
}

const ChatInput = ({ onSend, disabled, placeholder, presets = [] }: Props) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isListening, isSupported: micSupported, start: startMic, stop: stopMic } = useSpeechRecognition();

  const handleMicToggle = () => {
    if (isListening) {
      stopMic();
    } else {
      startMic((result) => {
        setText((prev) => (prev ? prev + ' ' : '') + result);
      });
    }
  };

  const hasContent = text.trim() || attachments.some((a) => !a.processing && !a.error);
  const isProcessing = attachments.some((a) => a.processing);

  // Filter presets matching current input
  const trimmed = text.trim().toLowerCase();
  const suggestions =
    trimmed.length > 0 ? presets.filter((p) => p.toLowerCase().includes(trimmed) && p.toLowerCase() !== trimmed) : [];

  const dispatchSend = (promptText: string) => {
    if (disabled || isProcessing) return;

    const attachmentTexts = attachments
      .filter((a) => a.extractedText && !a.error)
      .map((a) => `[Attachment: ${a.name}]\n${a.extractedText}`);

    const trimmedPrompt = promptText.trim();
    // Must have either a prompt or at least one successfully-extracted attachment
    if (!trimmedPrompt && attachmentTexts.length === 0) return;

    onSend(trimmedPrompt, attachmentTexts);
    setText('');
    setAttachments([]);
    setShowSuggestions(false);
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleSend = () => {
    if (!hasContent) return;
    dispatchSend(text);
  };

  const handleSelectPreset = (preset: string) => {
    dispatchSend(preset);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'; // ~5 rows
  }, []);

  // Auto-resize whenever text changes (typing, dictation, or programmatic)
  useEffect(() => {
    requestAnimationFrame(autoResize);
  }, [text, autoResize]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setShowSuggestions(true);
  };

  const processFile = async (file: File): Promise<string> => {
    if (file.type === 'text/plain') return readTextFile(file);
    if (file.type === 'application/pdf') return extractTextFromPdf(file);
    if (file.type.includes('image')) return extractTextFromImage(file);
    throw new Error(`Unsupported file type: ${file.type}`);
  };

  const addFiles = async (files: File[]) => {
    const available = MAX_ATTACHMENTS - attachments.length;
    if (available <= 0) {
      message.warning(`Maximum ${MAX_ATTACHMENTS} attachments allowed.`);
      return;
    }

    const toAdd = files.slice(0, available);
    if (files.length > available) {
      message.warning(`Only ${available} more attachment(s) allowed. ${files.length - available} file(s) skipped.`);
    }

    const newAttachments: Attachment[] = toAdd.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      extractedText: '',
      processing: true,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);

    for (let i = 0; i < toAdd.length; i++) {
      const file = toAdd[i];
      const id = newAttachments[i].id;
      try {
        const extracted = await processFile(file);
        setAttachments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, extractedText: extracted, processing: false } : a)),
        );
      } catch {
        setAttachments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, processing: false, error: 'Failed to extract text' } : a)),
        );
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) addFiles(files);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.includes('image')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length) {
      e.preventDefault();
      addFiles(imageFiles);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Highlight matching portion in a suggestion
  const renderHighlighted = (preset: string) => {
    const idx = preset.toLowerCase().indexOf(trimmed);
    if (idx === -1) return preset;
    return (
      <>
        {preset.slice(0, idx)}
        <strong>{preset.slice(idx, idx + trimmed.length)}</strong>
        {preset.slice(idx + trimmed.length)}
      </>
    );
  };

  return (
    <Wrapper>
      {attachments.length > 0 && (
        <AttachmentList>
          {attachments.map((a) => (
            <AttachmentChip key={a.id} $error={!!a.error}>
              <FileTextOutlined />
              <ChipName>{a.name}</ChipName>
              <ChipSize>({printFileSize(a.size)})</ChipSize>
              {a.processing && <Spin size="small" />}
              {a.error && <ChipError>{a.error}</ChipError>}
              <RemoveBtn onClick={() => removeAttachment(a.id)}>
                <CloseOutlined />
              </RemoveBtn>
            </AttachmentChip>
          ))}
          <AttachmentCount>
            {attachments.length}/{MAX_ATTACHMENTS}
          </AttachmentCount>
        </AttachmentList>
      )}

      <Pill $listening={isListening}>
        <input
          type="file"
          accept=".pdf,.txt,.png,.jpg,.jpeg,.gif,.webp"
          multiple
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />

        <IconBtn
          onClick={() => fileRef.current?.click()}
          disabled={disabled || attachments.length >= MAX_ATTACHMENTS}
          aria-label="Attach file"
        >
          <PlusOutlined />
        </IconBtn>

        <Input
          ref={inputRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={isListening ? 'Listening... speak now' : placeholder || 'Ask away...'}
          rows={1}
          disabled={disabled}
        />

        {micSupported && (
          <Tooltip title={isListening ? 'Stop dictation' : 'Start dictation'}>
            <MicBtn
              onClick={handleMicToggle}
              disabled={disabled}
              $active={isListening}
              aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
            >
              {isListening ? <AudioMutedOutlined /> : <AudioOutlined />}
            </MicBtn>
          </Tooltip>
        )}

        <SendBtn
          onClick={handleSend}
          disabled={!hasContent || disabled || isProcessing}
          $active={!!hasContent && !disabled && !isProcessing}
          aria-label="Send message"
        >
          <ArrowRightOutlined />
        </SendBtn>
      </Pill>

      {showSuggestions && suggestions.length > 0 && (
        <SuggestionList>
          {suggestions.slice(0, 4).map((preset) => (
            <SuggestionItem key={preset} onMouseDown={() => handleSelectPreset(preset)}>
              {renderHighlighted(preset)}
            </SuggestionItem>
          ))}
        </SuggestionList>
      )}
    </Wrapper>
  );
};

/* ── Styled Components ── */

const Wrapper = styled.div`
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  position: relative;

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 0 8px;
  }
`;

const Pill = styled.div<{ $listening?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 6px 6px 12px;
  border-radius: 28px;
  border: 1px solid ${(p) => (p.$listening ? 'var(--color-error)' : 'var(--color-border)')};
  background: var(--color-surface);
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;

  &:focus-within {
    border-color: ${(p) => (p.$listening ? 'var(--color-error)' : 'var(--color-primary)')};
    box-shadow: 0 0 0 3px ${(p) => (p.$listening ? 'rgba(239, 68, 68, 0.1)' : 'rgba(13, 148, 136, 0.1)')};
  }

  ${(p) => p.$listening && `box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);`}
`;

const Input = styled.textarea`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  font-family: inherit;
  line-height: 1.5;
  padding: 6px 4px;
  resize: none;
  min-height: 24px;
  max-height: 120px;
  color: var(--color-text);

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const IconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  font-size: 16px;
  transition: background 120ms ease;

  &:hover:not(:disabled) {
    background: var(--color-surface-elevated);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const MicBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 16px;
  transition: all 120ms ease;
  background: ${(p) => (p.$active ? 'var(--color-error)' : 'transparent')};
  color: ${(p) => (p.$active ? '#fff' : 'var(--color-text-secondary)')};

  &:hover:not(:disabled) {
    background: ${(p) => (p.$active ? 'var(--color-error)' : 'var(--color-surface-elevated)')};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const SendBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 14px;
  transition: all 120ms ease;
  background: ${(p) => (p.$active ? 'var(--color-primary)' : 'var(--color-surface-elevated)')};
  color: ${(p) => (p.$active ? '#fff' : 'var(--color-text-muted)')};

  &:hover:not(:disabled) {
    opacity: 0.85;
  }

  &:disabled {
    cursor: default;
  }
`;

const SuggestionList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  border-radius: 12px;
  overflow: hidden;
  z-index: 10;
`;

const SuggestionItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-light);
  line-height: 1.4;

  strong {
    color: var(--color-text);
    font-weight: 600;
  }

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-surface-elevated);
  }
`;

const AttachmentList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 8px;
  align-items: center;
`;

const AttachmentChip = styled.div<{ $error?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${(p) => (p.$error ? 'var(--color-error)' : 'var(--color-surface-elevated)')};
  color: ${(p) => (p.$error ? '#fff' : 'var(--color-text-secondary)')};
  border-radius: 6px;
  font-size: 12px;
  max-width: 220px;
`;

const ChipName = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

const ChipSize = styled.span`
  color: var(--color-text-muted);
  flex-shrink: 0;
`;

const ChipError = styled.span`
  font-size: 11px;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 2px;
  font-size: 10px;
  color: inherit;
  opacity: 0.6;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }
`;

const AttachmentCount = styled.span`
  font-size: 11px;
  color: var(--color-text-muted);
`;

export default ChatInput;
