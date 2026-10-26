/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Trash2, Keyboard, Sparkles, CheckCircle2 } from 'lucide-react';

interface SpeechControllerProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  onListeningStateChange?: (isListening: boolean) => void;
  placeholder?: string;
}

export const SpeechController: React.FC<SpeechControllerProps> = ({
  onSendMessage,
  disabled = false,
  onListeningStateChange,
  placeholder = "Click the microphone to answer with voice, or type your response here...",
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('[Speech] Recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setIsRecording(false);
          onListeningStateChange?.(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        onListeningStateChange?.(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('[Speech] Could not initialize SpeechRecognition:', err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [onListeningStateChange]);

  const toggleRecording = () => {
    if (disabled) return;

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
      onListeningStateChange?.(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
        onListeningStateChange?.(true);
      } catch (err) {
        console.warn('[Speech] Start failed:', err);
        setIsRecording(false);
        onListeningStateChange?.(false);
      }
    }
  };

  const handleSend = () => {
    if (!transcript.trim() || disabled) return;
    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
      onListeningStateChange?.(false);
    }
    onSendMessage(transcript.trim());
    setTranscript('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
      {/* Speech input text area */}
      <div className="relative">
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
        />

        {/* Live Speech Pulse Indicator inside textbox */}
        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            LIVE SPEECH RECORDING
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          {/* Mic Button */}
          {speechSupported ? (
            <button
              onClick={toggleRecording}
              disabled={disabled}
              type="button"
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isRecording
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse'
                  : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-emerald-400" />}
              {isRecording ? 'Stop Recording' : 'Answer with Mic'}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Keyboard className="h-3.5 w-3.5" />
              <span>Voice not supported in this browser, type your reply</span>
            </div>
          )}

          {transcript.length > 0 && (
            <button
              onClick={() => setTranscript('')}
              disabled={disabled}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
              title="Clear transcript"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Send Action */}
        <button
          onClick={handleSend}
          disabled={disabled || !transcript.trim()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          Submit to Tanya
        </button>
      </div>
    </div>
  );
};
