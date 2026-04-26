import { useState, useRef, useCallback } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
function getSpeechRecognitionClass(): (new () => any) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface SpeechRecognitionHook {
  isListening: boolean;
  isSupported: boolean;
  start: (onResult: (text: string) => void) => void;
  stop: () => void;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);

  const isSupported = !!getSpeechRecognitionClass();

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    callbackRef.current = null;
    if (rec) rec.stop();
    setIsListening(false);
  }, []);

  const start = useCallback((onResult: (text: string) => void) => {
    const SRClass = getSpeechRecognitionClass();
    if (!SRClass) return;

    callbackRef.current = onResult;

    const recognition = new SRClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      // Flush each finalized phrase immediately so text appears as the user speaks
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          if (transcript && callbackRef.current) {
            callbackRef.current(transcript);
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' and 'aborted' are expected in continuous mode — ignore them
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      stop();
    };

    recognition.onend = () => {
      // The browser can silently stop continuous recognition (e.g. after silence).
      // Restart automatically if we're still supposed to be listening.
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          stop();
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [stop]);

  return { isListening, isSupported, start, stop };
}
