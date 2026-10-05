'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Maximize2, Trash2, Copy, Check, Tag, Mic, Calendar, Volume2, VolumeX, Edit3 } from 'lucide-react';
import { ScreenshotItem } from '@/types/journal';
import { CanvasTheme } from '@/lib/themes';
import { generateAudioFromText, playAudioBlob, speakWithWebSpeech, isElevenLabsConfigured } from '@/lib/elevenlabs';

export interface ScreenshotNodeData extends ScreenshotItem {
  onDelete?: (id: string) => void;
  onPreview?: (item: ScreenshotItem) => void;
  onEdit?: (item: ScreenshotItem) => void;
  theme?: CanvasTheme;
}

/** Category colour accents — saturation/hue is always fixed; only alpha/border applied */
const categoryAccents: Record<string, { light: string; dark: string }> = {
  Recipes:       { light: '#b45309', dark: '#fbbf24' },
  Places:        { light: '#047857', dark: '#34d399' },
  Design:        { light: '#6d28d9', dark: '#a78bfa' },
  Receipts:      { light: '#57534e', dark: '#a8a29e' },
  Development:   { light: '#1d4ed8', dark: '#60a5fa' },
  Hacktoberfest: { light: '#c2410c', dark: '#fb923c' },
};

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return 'Undated';
  }
}

const ScreenshotNodeComponent = ({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ScreenshotNodeData;
  const theme = nodeData.theme;
  const isDark = theme?.isDark ?? false;
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleVoicePlayback = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    const textToSpeak = `${nodeData.title}. ${nodeData.summary}`;
    
    if (isElevenLabsConfigured()) {
      setIsAudioLoading(true);
      const audioBlob = await generateAudioFromText(textToSpeak, (state) => {
        setIsAudioLoading(state.isLoading);
      });
      
      if (audioBlob) {
        const audio = playAudioBlob(audioBlob);
        if (audio) {
          audioRef.current = audio;
          setIsPlaying(true);
          audio.onended = () => {
            setIsPlaying(false);
            audioRef.current = null;
          };
        }
      } else {
        // Fallback to Web Speech API
        const success = speakWithWebSpeech(textToSpeak, () => setIsPlaying(false));
        if (success) setIsPlaying(true);
      }
    } else {
      // Use Web Speech API as fallback
      const success = speakWithWebSpeech(textToSpeak, () => setIsPlaying(false));
      if (success) setIsPlaying(true);
    }
  };

  const accent = categoryAccents[nodeData.category] ?? { light: '#8c7e6b', dark: '#9ba3b4' };
  const accentColor = isDark ? accent.dark : accent.light;

  // Derived node colours — fall back to paperback defaults if no theme passed
  const nodeBg    = theme?.nodeBg    ?? '#ffffff';
  const nodeBorderColor = theme?.nodeBorder ?? 'rgba(120,80,20,0.1)';
  const titleColor = theme?.nodeText  ?? '#2d261e';
  const mutedColor = theme?.nodeTextMuted ?? '#5c4e3f';
  const tagBg     = theme?.accentBg  ?? '#f5efe2';
  const handleBg  = isDark ? theme?.sidebarBorder ?? '#2e3039' : '#d5cbba';
  const washiColor = theme?.washiTape ?? '#ede4d3';

  const copySummary = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${nodeData.title} - ${nodeData.summary}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleDelete  = (e: React.MouseEvent) => { e.stopPropagation(); nodeData.onDelete?.(nodeData.id); };
  const handlePreview = (e: React.MouseEvent) => { e.stopPropagation(); nodeData.onPreview?.(nodeData); };
  const handleEdit    = (e: React.MouseEvent) => { e.stopPropagation(); nodeData.onEdit?.(nodeData); };

  return (
    <div
      className={`group relative w-40 md:w-72 p-1.5 md:p-2 rounded-sm shadow-md transition-all duration-200 select-none ${
        selected
          ? 'shadow-2xl scale-[1.02] z-30'
          : 'hover:shadow-xl hover:-translate-y-0.5 z-10'
      }`}
      style={{
        backgroundColor: nodeBg,
        border: selected
          ? `2px solid ${accentColor}`
          : `1px solid ${nodeBorderColor}`,
        boxShadow: selected
          ? `0 0 0 3px ${accentColor}33, 0 20px 40px rgba(0,0,0,${isDark ? '0.6' : '0.12'})`
          : undefined,
      }}
    >
      {/* Washi tape */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 md:w-28 h-4 md:h-5 shadow-sm rotate-[-1deg] pointer-events-none z-20 flex items-center justify-center"
        style={{
          backgroundColor: washiColor + 'ee',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#d5cbba'}`,
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#d5cbba'}`,
          borderLeft: `2px dashed ${isDark ? 'rgba(255,255,255,0.12)' : '#b8a68f'}`,
          borderRight: `2px dashed ${isDark ? 'rgba(255,255,255,0.12)' : '#b8a68f'}`,
        }}
      >
        <span
          className="w-6 h-0.5 rounded-full"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#d5cbba' }}
        />
      </div>

      {/* React Flow handles — copper eyelets */}
      {([
        [Position.Top, 'target'],
        [Position.Bottom, 'source'],
        [Position.Left, 'target'],
        [Position.Right, 'source'],
      ] as const).map(([pos, type]) => (
        <Handle
          key={`${type}-${pos}`}
          type={type}
          position={pos}
          style={{
            width: 10, height: 10,
            background: handleBg,
            border: `2px solid ${accentColor}`,
          }}
        />
      ))}

      {/* Photo */}
      <div
        onClick={handlePreview}
        className="relative w-full aspect-[4/3] overflow-hidden rounded-[2px] cursor-pointer group/photo"
        style={{
          backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f5f1e8',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5dec9'}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={nodeData.screenshot}
          alt={nodeData.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-105"
        />

        {/* Desktop hover overlay */}
        <div className="hidden md:flex absolute inset-0 opacity-0 group-hover/photo:opacity-100 transition-opacity items-center justify-center gap-1.5 text-xs text-white font-serif backdrop-blur-[2px]"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <Maximize2 className="w-4 h-4" style={{ color: isDark ? '#90cdf4' : '#fde68a' }} />
          <span>Expand Photo</span>
        </div>

        {/* Desktop quick-actions */}
        <div className="hidden md:flex absolute top-1.5 right-1.5 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1 rounded transition-colors"
            style={{ backgroundColor: isDark ? 'rgba(30,30,40,0.9)' : 'rgba(255,255,255,0.92)', color: isDark ? '#d4dae8' : '#3c3022' }}
            title="Edit entry"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={handleVoicePlayback}
            disabled={isAudioLoading}
            className="p-1 rounded transition-colors"
            style={{ backgroundColor: isDark ? 'rgba(30,30,40,0.9)' : 'rgba(255,255,255,0.92)', color: isDark ? '#d4dae8' : '#3c3022' }}
            title={isPlaying ? 'Stop playback' : 'Listen to summary'}
          >
            {isAudioLoading ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <VolumeX className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </button>
          <button onClick={copySummary} className="p-1 rounded transition-colors" style={{ backgroundColor: isDark ? 'rgba(30,30,40,0.9)' : 'rgba(255,255,255,0.92)', color: isDark ? '#d4dae8' : '#3c3022' }}>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <button onClick={handleDelete} className="p-1 rounded transition-colors hover:text-rose-400" style={{ backgroundColor: isDark ? 'rgba(30,30,40,0.9)' : 'rgba(255,255,255,0.92)', color: isDark ? '#d4dae8' : '#3c3022' }}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Mobile tap hint */}
        <div className="md:hidden absolute bottom-0 inset-x-0 py-0.5 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <span className="text-[9px] text-white/90 font-serif">Tap to open</span>
        </div>
      </div>

      {/* Caption */}
      <div className="pt-2 pb-1 px-0.5 md:px-1 space-y-1.5">
        {/* Category stamp + date */}
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[9px] font-serif uppercase tracking-widest font-semibold border"
            style={{
              color: accentColor,
              backgroundColor: accentColor + '18',
              borderColor: accentColor + '55',
            }}
          >
            {nodeData.category || 'Memory'}
          </span>
          <span className="hidden md:flex items-center gap-1 text-[10px] font-serif" style={{ color: mutedColor }}>
            <Calendar className="w-3 h-3" style={{ color: theme?.textFaint ?? '#a39480' }} />
            {formatDate(nodeData.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif font-bold text-[11px] md:text-sm leading-snug line-clamp-2" style={{ color: titleColor }}>
          {nodeData.title}
        </h3>

        {/* Summary — desktop only */}
        <p className="hidden md:block font-serif italic text-xs line-clamp-2 leading-relaxed" style={{ color: mutedColor }}>
          {nodeData.summary}
        </p>

        {/* Voice note — mobile condensed */}
        {nodeData.instruction && (
          <div className="md:hidden flex items-center gap-1 text-[9px] font-serif" style={{ color: mutedColor }}>
            <Mic className="w-2.5 h-2.5 shrink-0" />
            <span className="italic line-clamp-1">{nodeData.instruction}</span>
          </div>
        )}

        {/* Mobile voice playback button */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={handleVoicePlayback}
            disabled={isAudioLoading}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-serif transition-all"
            style={{
              backgroundColor: isPlaying ? accentColor + '20' : tagBg,
              color: isPlaying ? accentColor : mutedColor,
              border: `1px solid ${isPlaying ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : '#e2dacb')}`,
            }}
          >
            {isAudioLoading ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <>
                <VolumeX className="w-2.5 h-2.5" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Volume2 className="w-2.5 h-2.5" />
                <span>Listen</span>
              </>
            )}
          </button>
          
          {/* Audio wave animation when playing */}
          {isPlaying && (
            <div className="flex items-center gap-0.5 h-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-0.5 bg-current rounded-full animate-pulse"
                  style={{
                    height: `${8 + Math.random() * 8}px`,
                    animationDelay: `${i * 100}ms`,
                    color: accentColor,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        {nodeData.tags && nodeData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {nodeData.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 text-[9px] font-serif px-1.5 py-0.5 rounded border"
                style={{
                  color: mutedColor,
                  backgroundColor: tagBg,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2dacb',
                }}
              >
                <Tag className="w-2 h-2" style={{ color: theme?.textFaint ?? '#a39480' }} />
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
            {nodeData.tags.length > 2 && (
              <span className="text-[9px] font-serif" style={{ color: theme?.textFaint ?? '#a39480' }}>
                +{nodeData.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ScreenshotNode = memo(ScreenshotNodeComponent);
