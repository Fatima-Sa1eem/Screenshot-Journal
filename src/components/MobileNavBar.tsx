'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Mic, MicOff, Plus, BookOpen, Upload, X, Sparkles } from 'lucide-react';

interface MobileNavBarProps {
  onOpenDrawer: () => void;
  onProcessScreenshot: (payload: { screenshot: string; instruction?: string }) => Promise<void>;
  isProcessing: boolean;
}

export function MobileNavBar({ onOpenDrawer, onProcessScreenshot, isProcessing }: MobileNavBarProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [showUploadSheet, setShowUploadSheet] = useState(false);

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
        if (t) setInstruction((prev) => (prev ? `${prev} ${t}` : t));
      };
      r.onerror = () => setIsRecording(false);
      r.onend = () => setIsRecording(false);
      recognitionRef.current = r;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch { /* noop */ }
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPendingFile(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Global Ctrl+V / mobile paste
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const f = items[i].getAsFile();
        if (f) { handleFileSelect(f); setShowUploadSheet(true); }
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const submitEntry = async () => {
    if (!pendingFile) return;
    await onProcessScreenshot({ screenshot: pendingFile, instruction: instruction.trim() || undefined });
    setPendingFile(null);
    setInstruction('');
    setShowUploadSheet(false);
  };

  return (
    <>
      {/* Fixed bottom nav bar — mobile only */}
      <div className="fixed bottom-4 left-4 right-4 z-30 md:hidden bg-[#f2ebd9]/95 backdrop-blur-md rounded-2xl p-3 border border-[#dcd3bf] shadow-xl flex justify-between items-center">

        {/* Voice note button */}
        <button
          onClick={toggleRecording}
          title={isRecording ? 'Stop recording' : 'Record voice note'}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            isRecording
              ? 'bg-rose-800/90 text-white animate-pulse'
              : 'bg-[#2d261e] text-[#fbf9f4] hover:bg-[#1a150e]'
          }`}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span className="text-[9px] font-serif">{isRecording ? 'Stop' : 'Voice'}</span>
        </button>

        {/* Upload / Quick Add photo button — centre */}
        <button
          onClick={() => setShowUploadSheet(true)}
          title="Add photo or screenshot"
          className="w-14 h-14 rounded-full bg-[#2d261e] text-[#fbf9f4] shadow-lg flex items-center justify-center border-4 border-[#f2ebd9] hover:bg-[#1a150e] transition-all active:scale-95"
        >
          <Plus className="w-7 h-7" />
        </button>

        {/* Journal menu / drawer button */}
        <button
          onClick={onOpenDrawer}
          title="Open journal menu"
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-[#ede5d5] text-[#3c3022] hover:bg-[#e0d7c4] transition-all"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-serif">Menu</span>
        </button>
      </div>

      {/* Mobile upload / voice sheet */}
      {showUploadSheet && (
        <div
          className="fixed inset-0 z-40 bg-[#2d261e]/50 backdrop-blur-sm flex items-end md:hidden"
          onClick={() => setShowUploadSheet(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-[#f3efe6] rounded-t-3xl border-t border-[#e2dacb] shadow-2xl p-5 space-y-4"
          >
            {/* Handle */}
            <div className="flex justify-center -mt-1 mb-1">
              <div className="w-10 h-1 rounded-full bg-[#c8bead]" />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-[#2d261e]">Add to Journal</h3>
              <button onClick={() => setShowUploadSheet(false)} className="p-1.5 rounded-lg text-[#8c7e6b] hover:bg-[#ede5d5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* File picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
            />

            {pendingFile ? (
              <div className="relative flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingFile} alt="Preview" className="w-full max-h-40 object-cover rounded-xl border border-[#e5dec9] shadow" />
                <button
                  onClick={() => setPendingFile(null)}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-[#2d261e] text-white shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 flex flex-col items-center gap-2 border-2 border-dashed border-[#d5cbba] rounded-2xl text-[#8c7e6b] hover:border-[#8c7e6b] hover:bg-[#faf7f0] transition-all"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm font-serif">Tap to choose photo or screenshot</span>
                <span className="text-xs text-[#a39480]">Camera or gallery</span>
              </button>
            )}

            {/* Voice note transcript */}
            {(instruction || isRecording) && (
              <div className="p-3 rounded-xl bg-[#faf7f0] border border-[#e2dacb]">
                <div className="text-[10px] uppercase tracking-wider text-[#a39480] font-serif mb-1">Voice Note</div>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={2}
                  placeholder="Your transcribed voice note..."
                  className="w-full bg-transparent border-none resize-none text-sm font-serif text-[#2d261e] focus:outline-none"
                />
              </div>
            )}

            {/* Record or clear */}
            <div className="flex gap-2">
              <button
                onClick={toggleRecording}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-serif border transition-all ${
                  isRecording
                    ? 'bg-rose-700 text-white border-rose-800 animate-pulse'
                    : 'bg-[#faf7f0] text-[#3c3022] border-[#e2dacb] hover:bg-[#ede5d5]'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecording ? 'Stop' : 'Dictate Note'}
              </button>

              <button
                onClick={submitEntry}
                disabled={!pendingFile || isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-serif font-semibold transition-all ${
                  !pendingFile || isProcessing
                    ? 'bg-[#e8e0d4] text-[#a39480] cursor-not-allowed'
                    : 'bg-[#2d261e] text-[#fbf9f4] hover:bg-[#1a150e] active:scale-[0.98]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isProcessing ? 'Processing...' : 'Pin to Journal'}
              </button>
            </div>

            {/* Bottom safe area spacer */}
            <div className="h-2" />
          </div>
        </div>
      )}
    </>
  );
}
