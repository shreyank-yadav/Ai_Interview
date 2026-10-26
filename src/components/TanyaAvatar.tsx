/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Sparkles, BrainCircuit, Mic } from 'lucide-react';
import { TanyaPersonaConfig } from '../types/index.ts';
import { api } from '../services/api.ts';

export type TanyaAvatarState = 'idle' | 'speaking' | 'listening' | 'thinking';

interface TanyaAvatarProps {
  state: TanyaAvatarState;
  persona?: TanyaPersonaConfig;
  lastSpokenText?: string;
  autoSpeak?: boolean;
}

export const TanyaAvatar: React.FC<TanyaAvatarProps> = ({
  state,
  persona,
  lastSpokenText,
  autoSpeak = true,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play audio when lastSpokenText changes
  useEffect(() => {
    if (!lastSpokenText || isMuted || !autoSpeak) return;

    let isCancelled = false;

    const playSpeech = async () => {
      try {
        setIsPlayingAudio(true);
        // Call backend TTS
        const result = await api.synthesizeVoice(lastSpokenText, persona?.voiceName);

        if (isCancelled) return;

        if (result.audioUrl) {
          if (audioRef.current) {
            audioRef.current.src = result.audioUrl;
            audioRef.current.play().catch(() => {
              // Autoplay restrictions fallback
              fallbackWebSpeech(lastSpokenText, persona?.speakingSpeed || 1.0);
            });
            audioRef.current.onended = () => setIsPlayingAudio(false);
          }
        } else {
          fallbackWebSpeech(lastSpokenText, persona?.speakingSpeed || 1.0);
        }
      } catch {
        fallbackWebSpeech(lastSpokenText, persona?.speakingSpeed || 1.0);
      }
    };

    playSpeech();

    return () => {
      isCancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    };
  }, [lastSpokenText, isMuted, autoSpeak, persona]);

  const fallbackWebSpeech = (text: string, rate: number = 1.0) => {
    if (!('speechSynthesis' in window) || isMuted) {
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.05;

    // Try finding a natural English voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female') || v.name.includes('Natural'))
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleManualReplay = () => {
    if (lastSpokenText) {
      fallbackWebSpeech(lastSpokenText, persona?.speakingSpeed || 1.0);
    }
  };

  const toggleMute = () => {
    if (!isMuted) {
      if (audioRef.current) audioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    setIsMuted(!isMuted);
  };

  // State glow styles
  const stateColor = {
    idle: 'ring-slate-700/60 shadow-slate-900/50',
    speaking: 'ring-indigo-500 shadow-indigo-500/40 ring-4 animate-pulse',
    listening: 'ring-emerald-500 shadow-emerald-500/40 ring-4',
    thinking: 'ring-amber-500 shadow-amber-500/40 ring-4 animate-pulse',
  }[state];

  const stateBadge = {
    idle: { label: 'Tanya Ready', bg: 'bg-slate-800 text-slate-300 border-slate-700' },
    speaking: { label: 'Tanya Speaking', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
    listening: { label: 'Listening to You...', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    thinking: { label: 'Analyzing Response...', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  }[state];

  const avatarUrl =
    persona?.customAvatarUrl ||
    'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=500&auto=format&fit=crop&q=80';

  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 shadow-2xl overflow-hidden">
      <audio ref={audioRef} className="hidden" />

      {/* Background ambient glow */}
      <div
        className={`absolute -top-24 h-56 w-56 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          state === 'speaking'
            ? 'bg-indigo-600/25 opacity-100'
            : state === 'listening'
            ? 'bg-emerald-600/20 opacity-100'
            : state === 'thinking'
            ? 'bg-amber-600/20 opacity-100'
            : 'bg-indigo-600/10 opacity-40'
        }`}
      />

      {/* Tanya Avatar Visual Frame */}
      <div className="relative mb-4">
        {/* Animated outer sound wave rings when speaking or listening */}
        {(state === 'speaking' || isPlayingAudio) && (
          <div className="absolute -inset-3 rounded-full border border-indigo-500/30 animate-ping pointer-events-none" />
        )}
        {state === 'listening' && (
          <div className="absolute -inset-3 rounded-full border border-emerald-500/40 animate-ping pointer-events-none" />
        )}

        <div
          className={`relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden transition-all duration-300 ring-2 ${stateColor}`}
        >
          <img
            src={avatarUrl}
            alt="Tanya - AI Interviewer"
            className="h-full w-full object-cover object-top scale-105"
          />

          {/* Speaking Overlay Wave */}
          {(state === 'speaking' || isPlayingAudio) && (
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent flex items-end justify-center pb-2">
              <div className="flex items-center gap-1">
                {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8, 0.3].map((h, i) => (
                  <span
                    key={i}
                    style={{ animationDelay: `${i * 120}ms`, height: `${h * 16}px` }}
                    className="w-1 rounded-full bg-indigo-300 animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mute/Audio toggle button */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute Tanya voice' : 'Mute Tanya voice'}
          className={`absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border shadow-lg transition ${
            isMuted
              ? 'border-red-500/40 bg-red-950/80 text-red-400 hover:bg-red-900'
              : 'border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Name and Demeanor Tag */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5">
          <h3 className="text-base font-bold text-white tracking-tight">Tanya</h3>
          <Sparkles className="h-4 w-4 text-indigo-400" />
        </div>
        <p className="text-xs text-slate-400">
          Senior AI Interviewer &middot;{' '}
          <span className="capitalize text-slate-300 font-medium">
            {persona?.tone === 'faang_strict'
              ? 'FAANG Bar Raiser'
              : persona?.tone === 'supportive'
              ? 'Empathetic Mentor'
              : 'Objective Evaluator'}
          </span>
        </p>
      </div>

      {/* Live State Badge */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${stateBadge.bg}`}
        >
          {state === 'speaking' && <Volume2 className="h-3 w-3 animate-bounce" />}
          {state === 'listening' && <Mic className="h-3 w-3 animate-pulse" />}
          {state === 'thinking' && <BrainCircuit className="h-3 w-3 animate-spin" />}
          {stateBadge.label}
        </span>

        {lastSpokenText && (
          <button
            onClick={handleManualReplay}
            className="rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:border-slate-700 hover:text-white transition"
            title="Replay voice audio"
          >
            Replay Voice
          </button>
        )}
      </div>
    </div>
  );
};
