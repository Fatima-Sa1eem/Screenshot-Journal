'use client';

import React, { useEffect, useRef } from 'react';
import { X, Search, LayoutGrid, PlusCircle, BookOpen } from 'lucide-react';
import { ThemeSelector } from '@/components/ThemeSelector';
import { CanvasTheme, ThemeId } from '@/lib/themes';

const defaultCategories = ['All', 'Recipes', 'Places', 'Design', 'Receipts'];

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  totalEntries: number;
  onAutoLayout: () => void;
  onAddSample: () => void;
  theme: CanvasTheme;
  activeThemeId: ThemeId;
  customBgColor: string;
  onThemeChange: (id: ThemeId) => void;
  onCustomColorChange: (hex: string) => void;
}

export function MobileDrawer({
  open,
  onClose,
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
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (open && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const allCategoryTags = Array.from(new Set([...defaultCategories, ...categories]));

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-[#2d261e]/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sliding bottom drawer */}
      <div
        ref={drawerRef}
        className={`fixed inset-x-0 bottom-0 z-50 md:hidden bg-[#f3efe6] rounded-t-3xl border-t border-[#e2dacb] shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '80vh' }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-[#c8bead]" />
        </div>

        <div className="overflow-y-auto px-5 pb-8 space-y-5" style={{ maxHeight: 'calc(80vh - 40px)' }}>
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8c7e6b]" />
              <span className="font-serif font-bold text-[#2d261e] text-base">Journal Menu</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#8c7e6b] hover:text-[#2d261e] hover:bg-[#ede5d5] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Natural language search */}
          <div>
            <label className="block text-[10px] font-serif uppercase tracking-widest text-[#6b5d4b] mb-1.5">
              Search Journal
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7e6b]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search photos, notes, tags..."
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-[#faf7f0] border border-[#e2dacb] text-[#2d261e] placeholder-[#a39480] focus:outline-none focus:border-[#a39480] font-serif"
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7e6b]">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Category filter tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-serif uppercase tracking-widest" style={{ color: theme.textSecondary }}>Categories</label>
              <span className="text-[10px] font-mono" style={{ color: theme.textFaint }}>{totalEntries} entries</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allCategoryTags.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { onCategoryChange(cat); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-serif border transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#2d261e] text-[#fbf9f4] border-[#2d261e] font-semibold'
                      : 'bg-[#faf7f0] text-[#5c4e3f] border-[#e2dacb] hover:bg-[#f5efe2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { onAutoLayout(); onClose(); }}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-serif transition-colors border"
              style={{ backgroundColor: theme.accentBg, color: theme.textPrimary, borderColor: theme.inputBorder }}
            >
              <LayoutGrid className="w-4 h-4" style={{ color: theme.textFaint }} />
              <span>Tidy Page</span>
            </button>
            <button
              onClick={() => { onAddSample(); onClose(); }}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-serif transition-colors"
              style={{ backgroundColor: theme.ctaBg, color: theme.ctaText }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Sample</span>
            </button>
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
    </>
  );
}
