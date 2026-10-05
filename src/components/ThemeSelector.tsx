'use client';

import React, { useRef } from 'react';
import { THEMES, ThemeId, CanvasTheme } from '@/lib/themes';

interface ThemeSelectorProps {
  activeTheme: ThemeId;
  customBgColor: string;
  onThemeChange: (id: ThemeId) => void;
  onCustomColorChange: (hex: string) => void;
  /** Passed so swatches can render with correct contrast */
  currentTheme: CanvasTheme;
}

const swatches: { id: Exclude<ThemeId, 'custom'>; color: string; ring: string }[] = [
  { id: 'paperback', color: '#f8f5ec', ring: '#b5a995' },
  { id: 'charcoal',  color: '#1a1c23', ring: '#4a5063' },
  { id: 'blue',      color: '#0d1b2a', ring: '#48cae4' },
];

export function ThemeSelector({
  activeTheme,
  customBgColor,
  onThemeChange,
  onCustomColorChange,
  currentTheme,
}: ThemeSelectorProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label
        className="block text-[11px] font-serif font-medium uppercase tracking-wider mb-1.5"
        style={{ color: currentTheme.textSecondary }}
      >
        Canvas Theme
      </label>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Preset swatches */}
        {swatches.map(({ id, color, ring }) => {
          const isActive = activeTheme === id;
          const preset = THEMES[id];
          return (
            <button
              key={id}
              onClick={() => onThemeChange(id)}
              title={preset.label}
              className="group flex flex-col items-center gap-1 transition-transform hover:scale-105 active:scale-95"
            >
              {/* Colour swatch circle */}
              <span
                className="w-8 h-8 rounded-full border-2 shadow-sm transition-all flex items-center justify-center text-base"
                style={{
                  backgroundColor: color,
                  borderColor: isActive ? ring : 'rgba(128,128,128,0.25)',
                  boxShadow: isActive ? `0 0 0 3px ${ring}55` : undefined,
                }}
              >
                <span className="text-sm leading-none">{preset.emoji}</span>
              </span>
              <span
                className="text-[9px] font-serif uppercase tracking-wide"
                style={{ color: isActive ? currentTheme.textPrimary : currentTheme.textFaint }}
              >
                {preset.label}
              </span>
            </button>
          );
        })}

        {/* Custom colour picker */}
        <button
          onClick={() => colorInputRef.current?.click()}
          title="Pick custom canvas colour"
          className="group flex flex-col items-center gap-1 transition-transform hover:scale-105 active:scale-95"
        >
          <span
            className="w-8 h-8 rounded-full border-2 shadow-sm overflow-hidden transition-all relative"
            style={{
              backgroundColor: customBgColor,
              borderColor: activeTheme === 'custom' ? customBgColor : 'rgba(128,128,128,0.25)',
              boxShadow: activeTheme === 'custom' ? `0 0 0 3px ${customBgColor}55` : undefined,
            }}
          >
            {/* Colour-wheel emoji overlay */}
            <span className="absolute inset-0 flex items-center justify-center text-sm">🎨</span>
          </span>
          <span
            className="text-[9px] font-serif uppercase tracking-wide"
            style={{ color: activeTheme === 'custom' ? currentTheme.textPrimary : currentTheme.textFaint }}
          >
            Custom
          </span>
        </button>

        {/* Hidden native colour input */}
        <input
          ref={colorInputRef}
          type="color"
          value={customBgColor}
          className="sr-only"
          onChange={(e) => {
            onCustomColorChange(e.target.value);
            onThemeChange('custom');
          }}
        />
      </div>

      {/* Active theme label pill */}
      <div
        className="mt-2 flex items-center gap-1.5 text-[10px] font-serif px-2 py-1 rounded-md border w-fit"
        style={{
          color: currentTheme.textSecondary,
          backgroundColor: currentTheme.accentBg,
          borderColor: currentTheme.sidebarBorder,
        }}
      >
        <span>{activeTheme === 'custom' ? '🎨' : THEMES[activeTheme as Exclude<ThemeId, 'custom'>]?.emoji ?? '🎨'}</span>
        <span>
          {activeTheme === 'custom'
            ? `Custom (${customBgColor})`
            : THEMES[activeTheme as Exclude<ThemeId, 'custom'>]?.label}
        </span>
      </div>
    </div>
  );
}
