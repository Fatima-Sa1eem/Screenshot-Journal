'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Tag, BookOpen } from 'lucide-react';
import { ScreenshotItem } from '@/types/journal';
import { CanvasTheme } from '@/lib/themes';

interface EditModalProps {
  item: ScreenshotItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { title?: string; category?: string; tags?: string[]; summary?: string }) => Promise<void>;
  theme: CanvasTheme;
}

const defaultCategories = ['Recipes', 'Places', 'Design', 'Receipts', 'Development', 'Hacktoberfest'];

export function EditModal({ item, isOpen, onClose, onSave, theme }: EditModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setCategory(item.category);
      setTags(item.tags.join(', '));
      setSummary(item.summary);
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    
    setIsSaving(true);
    try {
      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      
      await onSave(item.id, {
        title: title.trim() || item.title,
        category: category || item.category,
        tags: tagArray.length > 0 ? tagArray : item.tags,
        summary: summary.trim() || item.summary,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !item) return null;

  const isDark = theme?.isDark ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: theme?.sidebarBg ?? '#faf7f0',
          border: `1px solid ${theme?.sidebarBorder ?? 'rgba(120,80,20,0.1)'}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: theme?.sidebarBorder }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: theme?.textSecondary }} />
            <h2 className="font-serif font-bold text-sm" style={{ color: theme?.textPrimary }}>
              Edit Entry
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: theme?.textFaint }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-serif font-medium uppercase tracking-wider mb-1.5" style={{ color: theme?.textSecondary }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm font-serif border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: theme?.inputBg,
                borderColor: theme?.inputBorder,
                color: theme?.textPrimary,
              }}
              placeholder="Enter title..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-serif font-medium uppercase tracking-wider mb-1.5" style={{ color: theme?.textSecondary }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm font-serif border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: theme?.inputBg,
                borderColor: theme?.inputBorder,
                color: theme?.textPrimary,
              }}
            >
              {defaultCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-serif font-medium uppercase tracking-wider mb-1.5" style={{ color: theme?.textSecondary }}>
              Tags
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme?.textFaint }} />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm font-serif border focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: theme?.inputBg,
                  borderColor: theme?.inputBorder,
                  color: theme?.textPrimary,
                }}
                placeholder="tag1, tag2, tag3..."
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: theme?.textFaint }}>
              Separate tags with commas
            </p>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-[11px] font-serif font-medium uppercase tracking-wider mb-1.5" style={{ color: theme?.textSecondary }}>
              Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm font-serif border focus:outline-none focus:ring-2 transition-all resize-none"
              style={{
                backgroundColor: theme?.inputBg,
                borderColor: theme?.inputBorder,
                color: theme?.textPrimary,
              }}
              placeholder="Enter summary..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: theme?.sidebarBorder }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-serif transition-all"
            style={{
              backgroundColor: theme?.accentBg,
              color: theme?.textSecondary,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-sm font-serif font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            style={{
              backgroundColor: theme?.ctaBg,
              color: theme?.ctaText,
            }}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
