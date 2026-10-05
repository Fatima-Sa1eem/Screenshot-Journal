'use client';

import React from 'react';
import { X, Calendar, Tag, Download, MapPin, Mic, ExternalLink } from 'lucide-react';
import { ScreenshotItem } from '@/types/journal';

interface ImageModalProps {
  item: ScreenshotItem | null;
  onClose: () => void;
}

export function ImageModal({ item, onClose }: ImageModalProps) {
  if (!item) return null;

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = item.screenshot;
    link.download = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDirections = () => {
    const query = encodeURIComponent(item.title + ' ' + (item.category === 'Places' ? item.summary : ''));
    window.open(`https://www.google.com/maps/search/${query}`, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#2d261e]/70 backdrop-blur-sm"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Modal panel — full-screen sheet on mobile, centered card on desktop */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full md:max-w-2xl md:mx-4 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border border-amber-900/10 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Mobile grab handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-[#d5cbba]" />
        </div>

        {/* Washi tape ornament — desktop only */}
        <div
          className="hidden md:flex absolute -top-1 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#ede4d3]/95 border-b border-[#d5cbba] shadow-xs rotate-[-0.5deg] items-center justify-center"
          style={{ borderLeft: '2px dashed #b8a68f', borderRight: '2px dashed #b8a68f' }}
        />

        {/* Header */}
        <div className="flex items-start justify-between px-4 md:px-6 pt-2 md:pt-5 pb-3 border-b border-[#e5dec9]">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-serif uppercase tracking-wider font-semibold bg-[#f5efe2] text-[#5c4e3f] border border-[#e2dacb]">
                {item.category}
              </span>
              <h2 className="font-serif font-bold text-base md:text-lg text-[#2d261e] leading-tight">
                {item.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8c7e6b] font-serif mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#a39480]" />
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={downloadImage}
              title="Download Photo"
              className="p-2 rounded-lg text-[#736350] hover:text-[#2d261e] hover:bg-[#f5efe2] transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 rounded-lg text-[#736350] hover:text-[#2d261e] hover:bg-[#f5efe2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Full-resolution screenshot */}
        <div className="flex-1 overflow-auto px-4 md:px-6 py-3 flex items-center justify-center bg-[#faf7f0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.screenshot}
            alt={item.title}
            className="max-h-[45vh] md:max-h-[55vh] max-w-full rounded object-contain shadow border border-[#e8dfcf]"
          />
        </div>

        {/* Footer: summary, voice history, tags, and action buttons */}
        <div className="px-4 md:px-6 py-4 border-t border-[#e5dec9] space-y-3 bg-white">
          {/* Summary caption */}
          <p className="font-serif italic text-sm text-[#4a3e31] leading-relaxed">
            &ldquo;{item.summary}&rdquo;
          </p>

          {/* Voice instruction history */}
          {item.instruction && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#faf7f0] border border-[#e5dec9]">
              <Mic className="w-4 h-4 text-[#8c7e6b] shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#a39480] font-serif font-semibold mb-0.5">
                  Voice Instruction
                </div>
                <p className="text-xs font-serif text-[#3e3428] italic">&ldquo;{item.instruction}&rdquo;</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-serif text-[#6b5d4b] bg-[#f5efe2] border border-[#e2dacb]"
                >
                  <Tag className="w-2.5 h-2.5 text-[#a39480]" />#{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Location Directions button — always shown for discoverability */}
            <button
              onClick={openDirections}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-serif font-semibold border transition-all active:scale-[0.98] ${
                item.category === 'Places'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm hover:bg-emerald-700'
                  : 'bg-[#f5efe2] text-[#5c4e3f] border-[#e2dacb] hover:bg-[#ede5d5]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Directions</span>
            </button>

            {/* Download */}
            <button
              onClick={downloadImage}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-serif font-semibold border bg-[#2d261e] text-[#fbf9f4] border-[#2d261e] hover:bg-[#1a150e] transition-all active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
