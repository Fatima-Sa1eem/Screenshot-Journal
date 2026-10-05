'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Upload, X, Search, Sparkles, LayoutGrid, PlusCircle } from 'lucide-react';
import { ThemeSelector } from '@/components/ThemeSelector';
import { CanvasTheme, ThemeId } from '@/lib/themes';

const defaultCategories = ['All', 'Recipes', 'Places', 'Design', 'Receipts'];

interface SidebarProps {
  onProcessScreenshot: (payload: { screenshot: string; instruction?: string }) => Promise<void>;
  isProcessing: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  totalEntries: number;
  onAutoLayout: () => void;
  onAddSample: () => void;
  // Theme engine
  theme: CanvasTheme;
  activeThemeId: ThemeId;
  customBgColor: string;
  onThemeChange: (id: ThemeId) => void;
  onCustomColorChange: (hex: string) => void;
}

export function Sidebar({
  onProcessScreenshot,
  isProcessing,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  totalEntries,
  onAutoLayout,
  onAddSample,
  theme,
  activeThemeId,
  customBgColor,
  onThemeChange,
  onCustomColorChange,
}: SidebarProps) {
  const [instruction, setInstruction] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pastedToast, setPastedToast] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');

  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-US';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.onresult = (e: any) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
        if (t) setInstruction((p) => (p ? `${p} ${t}` : t));
      };
      r.onerror = () => setIsRecording(false);
      r.onend = () => setIsRecording(false);
      recognitionRef.current = r;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) { alert('Speech Recognition not supported.'); return; }
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); }
    else { try { recognitionRef.current.start(); setIsRecording(true); } catch { /**/ } }
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGlobalPaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const f = items[i].getAsFile();
        if (f) { handleFileChange(f); setPastedToast(true); setTimeout(() => setPastedToast(false), 2500); break; }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handleGlobalPaste]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotPreview) return;
    await onProcessScreenshot({ screenshot: screenshotPreview, instruction: instruction.trim() || undefined });
    setScreenshotPreview(null); setInstruction('');
    if (isRecording && recognitionRef.current) { recognitionRef.current.stop(); setIsRecording(false); }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const allCategoryTags = Array.from(new Set([...defaultCategories, ...categories]));

  // Theming helpers
  const t = theme;

  return (
    <aside
      className="w-72 h-[100dvh] flex flex-col justify-between shrink-0 select-none overflow-y-auto z-20 transition-colors duration-500"
      style={{
        backgroundColor: t.sidebarBg,
        borderRight: `1px solid ${t.sidebarBorder}`,
        boxShadow: `4px 0 15px rgba(0,0,0,${t.isDark ? '0.3' : '0.03'})`,
      }}
    >
      <div className="space-y-5 p-6">
        {/* ── Header ── */}
        <div className="pb-4" style={{ borderBottom: `1px solid ${t.sidebarBorder}` }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-widest uppercase font-mono font-medium" style={{ color: t.textFaint }}>
              Vol. I · Field Notes
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-serif italic"
              style={{ backgroundColor: t.accentBg, color: t.textSecondary }}
            >
              {activeThemeId === 'paperback' ? 'Paperback' : activeThemeId === 'charcoal' ? 'Charcoal' : activeThemeId === 'blue' ? 'Bestie Blue' : 'Custom'}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight mt-1.5" style={{ color: t.textPrimary }}>
            Screenshot Journal
          </h1>
          <p className="text-xs mt-1 font-serif italic leading-snug" style={{ color: t.textSecondary }}>
            Tactile memories &amp; AI annotations
          </p>
        </div>

        {/* ── AI Search ── */}
        <div>
          <label className="block text-[11px] font-serif font-medium uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary }}>
            Journal Search
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ask or search your journal..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg shadow-inner font-serif transition-all focus:outline-none focus:ring-1"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.textPrimary,
              }}
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1" style={{ color: t.textFaint }}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── Instruction Input (Text or Voice) ── */}
        <div>
          <label className="block text-[11px] font-serif font-medium uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary }}>
            Instruction
          </label>
          
          {/* Mode Toggle */}
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-serif font-medium transition-all ${
                inputMode === 'text' ? 'shadow-sm' : 'opacity-60'
              }`}
              style={{
                backgroundColor: inputMode === 'text' ? t.ctaBg : t.inputBg,
                color: inputMode === 'text' ? t.ctaText : t.textSecondary,
                borderColor: t.inputBorder,
              }}
            >
              Type
            </button>
            <button
              type="button"
              onClick={() => setInputMode('voice')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-serif font-medium transition-all ${
                inputMode === 'voice' ? 'shadow-sm' : 'opacity-60'
              }`}
              style={{
                backgroundColor: inputMode === 'voice' ? t.ctaBg : t.inputBg,
                color: inputMode === 'voice' ? t.ctaText : t.textSecondary,
                borderColor: t.inputBorder,
              }}
            >
              Voice
            </button>
          </div>

          {/* Text Input */}
          {inputMode === 'text' && (
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
              placeholder="Add a note or instruction for AI analysis..."
              className="w-full px-3 py-2 rounded-lg text-xs font-serif border focus:outline-none resize-none transition-all"
              style={{
                backgroundColor: t.inputBg,
                borderColor: t.inputBorder,
                color: t.textPrimary,
              }}
            />
          )}

          {/* Voice Input */}
          {inputMode === 'voice' && (
            <>
              <button
                type="button"
                onClick={toggleRecording}
                className={`w-full relative flex items-center justify-between px-3.5 py-3 rounded-xl border text-xs font-serif transition-all duration-200 shadow-sm ${
                  isRecording ? 'animate-pulse' : 'active:scale-[0.99]'
                }`}
                style={{
                  backgroundColor: isRecording ? '#7f1d1d' : t.ctaBg,
                  color: isRecording ? '#fecaca' : t.ctaText,
                  borderColor: isRecording ? '#991b1b' : t.ctaBg,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: isRecording ? '#991b1b' : t.isDark ? t.accentBg : '#43392d',
                      color: isRecording ? '#fff' : t.isDark ? t.accentText : '#e8dfcf',
                    }}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold tracking-wide">{isRecording ? 'Listening...' : 'Tap to record'}</div>
                    <div className="text-[10px] opacity-75 font-sans">{isRecording ? 'Tap when finished' : 'Voice input for instruction'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 pr-1">
                  {[
                    isRecording ? 'h-4 animate-bounce' : 'h-2 opacity-50',
                    isRecording ? 'h-6 animate-bounce [animation-delay:150ms]' : 'h-3 opacity-50',
                    isRecording ? 'h-3 animate-bounce [animation-delay:300ms]' : 'h-1.5 opacity-50',
                  ].map((cls, i) => (
                    <span key={i} className={`w-1 rounded-full bg-current transition-all ${cls}`} />
                  ))}
                </div>
              </button>

              {(instruction || isRecording) && (
                <div className="mt-2 p-2.5 rounded-lg shadow-inner text-xs font-serif">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-1" style={{ color: t.textFaint }}>
                    <span>Transcribed</span>
                    <button onClick={() => setInstruction('')} className="hover:text-rose-500">Clear</button>
                  </div>
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    rows={2}
                    placeholder="Transcribed voice note..."
                    className="w-full bg-transparent resize-none border-none p-0 text-xs focus:outline-none"
                    style={{ color: t.textPrimary }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Drag-and-Drop Upload ── */}
        <div>
          <label className="block text-[11px] font-serif font-medium uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary }}>
            Attach Screenshot
          </label>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileChange(e.target.files[0]); }} />
          <div
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => !screenshotPreview && fileInputRef.current?.click()}
            className="relative rounded-xl border-2 border-dashed transition-all p-3 text-center cursor-pointer"
            style={{
              borderColor: dragActive ? t.ctaBg : screenshotPreview ? t.textFaint : t.inputBorder,
              backgroundColor: dragActive ? t.accentBg : t.inputBg,
            }}
          >
            {screenshotPreview ? (
              <div className="space-y-2">
                <div className="relative inline-block p-1 shadow-md rounded-sm" style={{ backgroundColor: t.nodeBg, border: `1px solid ${t.inputBorder}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotPreview} alt="Preview" className="w-28 h-20 object-cover rounded-sm" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setScreenshotPreview(null); }}
                    className="absolute -top-2 -right-2 p-1 rounded-full shadow hover:bg-rose-700"
                    style={{ backgroundColor: t.ctaBg, color: t.ctaText }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[11px] font-serif italic" style={{ color: t.textSecondary }}>Photo ready to pin</div>
                <button type="button" onClick={handleSubmit} disabled={isProcessing}
                  className="w-full py-2 px-3 rounded-lg text-xs font-serif font-medium shadow flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  style={{ backgroundColor: t.ctaBg, color: t.ctaText }}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isProcessing ? 'Gemma:2b analyzing...' : 'Pin to Journal'}</span>
                </button>
              </div>
            ) : (
              <div className="py-2.5">
                <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1.5 shadow-inner"
                  style={{ backgroundColor: t.accentBg, color: t.textSecondary }}>
                  <Upload className="w-4 h-4" />
                </div>
                <div className="font-serif text-xs font-semibold" style={{ color: t.textPrimary }}>Drop photo or screenshot</div>
                <div className="text-[10px] font-sans mt-0.5" style={{ color: t.textFaint }}>
                  Click to browse ·{' '}
                  <kbd className="px-1 py-0.5 rounded text-[9px] font-mono" style={{ backgroundColor: t.accentBg, color: t.textSecondary }}>
                    Ctrl+V
                  </kbd>
                  {' '}to paste
                </div>
              </div>
            )}
          </div>
          {pastedToast && (
            <div className="mt-1 text-[11px] text-emerald-600 font-serif italic text-center">✓ Screenshot pasted!</div>
          )}
        </div>

        {/* ── Category Filter ── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-serif font-medium uppercase tracking-wider" style={{ color: t.textSecondary }}>Categories</label>
            <span className="text-[10px] font-mono" style={{ color: t.textFaint }}>{totalEntries} entries</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allCategoryTags.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className="px-2.5 py-1 rounded-md text-xs font-serif transition-all duration-150 border"
                  style={{
                    backgroundColor: active ? t.ctaBg : t.accentBg,
                    color: active ? t.ctaText : t.textSecondary,
                    borderColor: active ? t.ctaBg : t.inputBorder,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Canvas Theme Selector ── */}
        <ThemeSelector
          activeTheme={activeThemeId}
          customBgColor={customBgColor}
          onThemeChange={onThemeChange}
          onCustomColorChange={onCustomColorChange}
          currentTheme={theme}
        />
      </div>

      {/* ── Footer ── */}
      <div className="p-6 pt-4 space-y-2 mt-auto" style={{ borderTop: `1px solid ${t.sidebarBorder}` }}>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAutoLayout}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-[11px] font-serif transition-colors border"
            style={{ backgroundColor: t.accentBg, color: t.textPrimary, borderColor: t.inputBorder }}
          >
            <LayoutGrid className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
            <span>Tidy Page</span>
          </button>
          <button
            onClick={onAddSample}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-[11px] font-serif transition-colors border"
            style={{ backgroundColor: t.accentBg, color: t.textPrimary, borderColor: t.inputBorder }}
          >
            <PlusCircle className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
            <span>Add Sample</span>
          </button>
        </div>

        <div
          className="p-2 rounded-lg text-[10px] font-serif flex items-center justify-between"
          style={{ backgroundColor: t.footerBg, border: `1px solid ${t.sidebarBorder}`, color: t.textSecondary }}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Ollama Gemma:2b
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: t.textFaint }}>Atlas Sync</span>
        </div>
      </div>
    </aside>
  );
}
