'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Mic,
  MicOff,
  Sparkles,
  Send,
  Image as ImageIcon,
  X,
  Search,
  Flame,
  LayoutGrid,
  RefreshCw,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { ScreenshotItem } from '@/types/journal';

interface TopBarProps {
  onProcessScreenshot: (payload: {
    screenshot: string;
    instruction?: string;
  }) => Promise<void>;
  isProcessing: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  totalEntries: number;
  onAutoLayout: () => void;
  onAddSample: () => void;
}

export function TopBar({
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
}: TopBarProps) {
  const [instruction, setInstruction] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showPasteToast, setShowPasteToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported in browser
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setInstruction((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. You can type instructions directly.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Speech recognition start failed:', err);
      }
    }
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setScreenshotPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // Global paste handler to paste screenshot directly with Ctrl+V
  const handleGlobalPaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileChange(file);
          setShowPasteToast(true);
          setTimeout(() => setShowPasteToast(false), 3000);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handleGlobalPaste]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotPreview) {
      alert('Please select or paste a screenshot first');
      return;
    }

    await onProcessScreenshot({
      screenshot: screenshotPreview,
      instruction: instruction.trim() || undefined,
    });

    // Reset inputs on success
    setScreenshotPreview(null);
    setInstruction('');
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <header className="relative z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-lg">
      {/* Top Banner: Brand + Hacktoberfest Badge + Stats */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-slate-100 tracking-tight">
                Screenshot Journal
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                <Flame className="w-3 h-3 text-orange-400" />
                Hacktoberfest
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ollama <span className="font-mono text-cyan-400 font-medium">gemma:2b</span> + MongoDB Atlas + 2D React Flow Canvas
            </p>
          </div>
        </div>

        {/* Global Toolbar Controls: Search, Filter, Auto-Layout, Sample */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes or tags..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 w-44 md:w-52 transition-all"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500/60 transition-all"
          >
            <option value="All">All Categories ({totalEntries})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Auto Layout Button */}
          <button
            onClick={onAutoLayout}
            title="Auto-arrange nodes on canvas"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Auto-Layout</span>
          </button>

          {/* Add Sample Demo Note */}
          <button
            onClick={onAddSample}
            title="Add sample Hacktoberfest screenshot note"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Add Sample</span>
          </button>
        </div>
      </div>

      {/* Main Action Bar: Screenshot Upload + Voice/Text Instruction */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row items-stretch gap-3">
          {/* 1. File Upload / Paste Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex items-center gap-3 p-2.5 rounded-xl border border-dashed transition-all duration-200 ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/20'
                : screenshotPreview
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
            } min-w-[280px]`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {screenshotPreview ? (
              <div className="flex items-center gap-2.5 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotPreview}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Screenshot Loaded
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Ready for Gemma:2b processing
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScreenshotPreview(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2.5 w-full cursor-pointer select-none"
              >
                <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-200">
                    Upload Screenshot
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>Drag & drop, click, or</span>
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                      Ctrl+V
                    </kbd>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Voice Note / Instruction Input */}
          <div className="flex-1 relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Add optional voice note or prompt (e.g., 'Documenting Hacktoberfest challenge setup')..."
                className="w-full pl-3.5 pr-11 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />

              {/* Microphone Voice Note Toggle */}
              <button
                type="button"
                onClick={toggleRecording}
                title={isRecording ? 'Stop voice recording' : 'Dictate voice note'}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/40'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Submit / Process Button */}
            <button
              type="submit"
              disabled={isProcessing || !screenshotPreview}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all ${
                isProcessing || !screenshotPreview
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 border border-cyan-400/40 active:scale-95'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Processing with Gemma:2b...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Pin to Canvas</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggestion pills */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-900/60 overflow-x-auto text-[11px] text-slate-500 scrollbar-none">
          <span className="shrink-0 flex items-center gap-1 text-slate-400 font-medium">
            <HelpCircle className="w-3 h-3 text-cyan-400" /> Quick Prompts:
          </span>
          {[
            'Reviewing Hacktoberfest Pull Request',
            'React Flow infinite canvas layout logic',
            'MongoDB Atlas schema and indexing plan',
            'Ollama gemma:2b prompt tuning & JSON output',
            'Bug report: CSS overflow on mobile viewport',
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInstruction(prompt)}
              className="shrink-0 px-2.5 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Clipboard Toast Banner */}
      {showPasteToast && (
        <div className="absolute bottom-[-34px] left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-900/90 text-cyan-200 text-xs border border-cyan-500/40 shadow-xl backdrop-blur-md animate-fade-in flex items-center gap-1.5 z-50">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Screenshot pasted from clipboard!</span>
        </div>
      )}
    </header>
  );
}
