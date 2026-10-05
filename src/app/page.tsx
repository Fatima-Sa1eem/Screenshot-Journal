'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MobileNavBar } from '@/components/MobileNavBar';
import { MobileDrawer } from '@/components/MobileDrawer';
import { JournalCanvas } from '@/components/canvas/JournalCanvas';
import { ImageModal } from '@/components/ImageModal';
import { ScreenshotItem } from '@/types/journal';
import { Check, AlertCircle, BookOpen } from 'lucide-react';
import { getActiveTheme, ThemeId } from '@/lib/themes';

// Generates an elegant SVG Polaroid graphic for demo entries
function generateJournalDemoScreenshot(
  title: string,
  category: string,
  accentColor: string,
  iconSymbol: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <defs>
      <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#faf6ee"/>
        <stop offset="100%" stop-color="#f0e9dc"/>
      </linearGradient>
      <pattern id="graph" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5dec9" stroke-width="0.8"/>
      </pattern>
    </defs>
    <rect width="600" height="450" fill="url(#paperGrad)"/>
    <rect width="600" height="450" fill="url(#graph)"/>
    <rect x="25" y="25" width="550" height="400" rx="8" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/>
    <rect x="50" y="50" width="130" height="32" rx="4" fill="${accentColor}18" stroke="${accentColor}" stroke-width="1.5"/>
    <text x="115" y="71" fill="${accentColor}" font-family="Georgia, serif" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1.5">${category.toUpperCase()}</text>
    <text x="530" y="72" fill="#8c7e6b" font-family="Georgia, serif" font-size="12" font-style="italic" text-anchor="end">Oct 2026 · Field Notes</text>
    <circle cx="300" cy="210" r="75" fill="${accentColor}15" stroke="${accentColor}55" stroke-width="2"/>
    <text x="300" y="228" font-size="52" text-anchor="middle">${iconSymbol}</text>
    <text x="300" y="325" fill="#2d261e" font-family="Georgia, serif" font-size="20" font-weight="bold" text-anchor="middle">${title}</text>
    <text x="300" y="355" fill="#6b5d4b" font-family="Georgia, serif" font-size="13" font-style="italic" text-anchor="middle">Recorded in Screenshot Journal · Paperback Edition</text>
    <line x1="60" y1="390" x2="540" y2="390" stroke="#d5cbba" stroke-width="1"/>
    <text x="300" y="412" fill="#a39480" font-family="monospace" font-size="10" text-anchor="middle" letter-spacing="2">NO. 2026-SJ-042</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const sampleJournalEntries = [
  { title: 'Tuscan Herb Pasta & Sauce', category: 'Recipes', color: '#b45309', symbol: '🍝', instruction: 'Family recipe: simmer San Marzano tomatoes with fresh basil, olive oil, and crushed garlic for 45 minutes.' },
  { title: 'Kyoto Bamboo Grove Walk', category: 'Places', color: '#047857', symbol: '🎋', instruction: 'Morning exploration in Arashiyama. Peaceful sound of rustling stalks and morning mist at 6:30 AM.' },
  { title: 'Paperback Typography Spec', category: 'Design', color: '#6d28d9', symbol: '✒️', instruction: 'Editorial design system: Lora serif headlines, 24px baseline graph grid, and tactile washi tape photo cards.' },
  { title: 'Artisan Espresso Roastery', category: 'Receipts', color: '#57534e', symbol: '☕', instruction: 'Monthly supply: 2x 250g Ethiopian Yirgacheffe filter roast. Total: $28.50.' },
];

export default function ScreenshotJournalPage() {
  const [items, setItems] = useState<ScreenshotItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewItem, setPreviewItem] = useState<ScreenshotItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>('paperback');
  const [customBgColor, setCustomBgColor] = useState('#faf7f0');

  const theme = getActiveTheme(activeThemeId, customBgColor);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchScreenshots = useCallback(async () => {
    try {
      const res = await fetch('/api/process-screenshot');
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) setItems(data.items);
      }
    } catch (err) {
      console.warn('Could not load existing screenshots:', err);
    }
  }, []);

  useEffect(() => { fetchScreenshots(); }, [fetchScreenshots]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => { if (item.category) set.add(item.category); });
    return Array.from(set);
  }, [items]);

  const handleProcessScreenshot = async ({
    screenshot,
    instruction,
  }: {
    screenshot: string;
    instruction?: string;
  }) => {
    setIsProcessing(true);
    try {
      const col = items.length % 3;
      const row = Math.floor(items.length / 3);
      const position = {
        x: col * 220 + 60,
        y: row * 320 + 60,
      };

      const res = await fetch('/api/process-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshot, instruction, position }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const result = await res.json();
      if (result.success && result.data) {
        setItems((prev) => [result.data, ...prev]);
        showToast(`Taped to journal! (${result.data.category})`, 'success');
      }
    } catch (err) {
      console.error('Process screenshot error:', err);
      showToast('Error taping note to journal.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteNode = async (id: string) => {
    try {
      const res = await fetch(`/api/process-screenshot?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        showToast('Photo removed from journal', 'info');
      }
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleAutoLayout = () => {
    setItems((prev) =>
      prev.map((item, index) => ({
        ...item,
        position: {
          x: (index % 3) * 220 + 60,
          y: Math.floor(index / 3) * 320 + 60,
        },
      }))
    );
    showToast('Polaroids arranged neatly', 'info');
  };

  const handleAddSample = async () => {
    const sample = sampleJournalEntries[items.length % sampleJournalEntries.length];
    const screenshot = generateJournalDemoScreenshot(sample.title, sample.category, sample.color, sample.symbol);
    await handleProcessScreenshot({ screenshot, instruction: sample.instruction });
  };

  return (
    <div className="flex w-screen h-[100dvh] overflow-hidden bg-[#faf7f0] text-[#2d261e]">
      {/* ── Left Sidebar — desktop only (md+) ── */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          onProcessScreenshot={handleProcessScreenshot}
          isProcessing={isProcessing}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          totalEntries={items.length}
          onAutoLayout={handleAutoLayout}
          onAddSample={handleAddSample}
          theme={theme}
          activeThemeId={activeThemeId}
          customBgColor={customBgColor}
          onThemeChange={setActiveThemeId}
          onCustomColorChange={setCustomBgColor}
        />
      </div>

      {/* ── Infinite Paperback Canvas — fills remaining space ── */}
      <main className="flex-1 h-screen relative overflow-hidden">
        <JournalCanvas
          items={items}
          onDeleteNode={handleDeleteNode}
          onPreviewNode={setPreviewItem}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          theme={theme}
        />
      </main>

      {/* ── Mobile: Fixed bottom nav bar ── */}
      <MobileNavBar
        onOpenDrawer={() => setDrawerOpen(true)}
        onProcessScreenshot={handleProcessScreenshot}
        isProcessing={isProcessing}
      />

      {/* ── Mobile: Sliding bottom drawer ── */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        totalEntries={items.length}
        onAutoLayout={handleAutoLayout}
        onAddSample={handleAddSample}
        theme={theme}
        activeThemeId={activeThemeId}
        customBgColor={customBgColor}
        onThemeChange={setActiveThemeId}
        onCustomColorChange={setCustomBgColor}
      />

      {/* ── Fullscreen Polaroid Modal (mobile bottom sheet / desktop centered) ── */}
      <ImageModal item={previewItem} onClose={() => setPreviewItem(null)} />

      {/* ── Toast notification ── */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#f3efe6] border border-[#e2dacb] shadow-xl text-xs font-serif text-[#2d261e]">
          {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-700" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-700" />}
          {toast.type === 'info' && <BookOpen className="w-4 h-4 text-[#8c7e6b]" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
