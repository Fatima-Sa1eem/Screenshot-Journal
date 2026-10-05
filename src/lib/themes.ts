// ─────────────────────────────────────────────
// Canvas Theme Engine – Screenshot Journal
// ─────────────────────────────────────────────

export type ThemeId = 'paperback' | 'charcoal' | 'blue' | 'custom';

export interface CanvasTheme {
  id: ThemeId;
  label: string;
  emoji: string;
  canvasBg: string;        // React Flow wrapper background
  gridColor: string;       // Background component grid/dot color
  sidebarBg: string;       // Sidebar / drawer background
  sidebarBorder: string;   // Sidebar border
  textPrimary: string;     // Main body text
  textSecondary: string;   // Muted / label text
  textFaint: string;       // Ultra-muted (timestamps, stamps)
  inputBg: string;         // Search & textarea backgrounds
  inputBorder: string;     // Input border
  nodeBg: string;          // Polaroid card background
  nodeBorder: string;      // Polaroid card border
  nodeText: string;        // Card title / caption
  nodeTextMuted: string;   // Card subtext / tags
  accentBg: string;        // Pill & category chip background
  accentText: string;      // Accent text (links, active state)
  ctaBg: string;           // Primary CTA button background
  ctaText: string;         // Primary CTA text
  washiTape: string;       // Washi tape strip color
  footerBg: string;        // Footer / status strip background
  isDark: boolean;         // True for charcoal & blue themes
}

export const THEMES: Record<Exclude<ThemeId, 'custom'>, CanvasTheme> = {
  paperback: {
    id: 'paperback',
    label: 'Paperback',
    emoji: '📜',
    canvasBg: '#faf7f0',
    gridColor: '#e5dec9',
    sidebarBg: '#f3efe6',
    sidebarBorder: '#e2dacb',
    textPrimary: '#2d261e',
    textSecondary: '#6b5d4b',
    textFaint: '#a39480',
    inputBg: '#faf7f0',
    inputBorder: '#e2dacb',
    nodeBg: '#ffffff',
    nodeBorder: 'rgba(120, 80, 20, 0.1)',
    nodeText: '#2d261e',
    nodeTextMuted: '#5c4e3f',
    accentBg: '#f5efe2',
    accentText: '#3c3022',
    ctaBg: '#2d261e',
    ctaText: '#fbf9f4',
    washiTape: '#ede4d3',
    footerBg: '#eae3d4',
    isDark: false,
  },
  charcoal: {
    id: 'charcoal',
    label: 'Charcoal',
    emoji: '🌙',
    canvasBg: '#121316',
    gridColor: '#262930',
    sidebarBg: '#1a1c23',
    sidebarBorder: '#2e3039',
    textPrimary: '#f0f2f5',
    textSecondary: '#9ba3b4',
    textFaint: '#5a6172',
    inputBg: '#0f1114',
    inputBorder: '#2e3039',
    nodeBg: '#1e2028',
    nodeBorder: 'rgba(255,255,255,0.08)',
    nodeText: '#f0f2f5',
    nodeTextMuted: '#9ba3b4',
    accentBg: '#262930',
    accentText: '#d4dae8',
    ctaBg: '#f0f2f5',
    ctaText: '#121316',
    washiTape: '#2a2d38',
    footerBg: '#161820',
    isDark: true,
  },
  blue: {
    id: 'blue',
    label: 'Bestie Blue',
    emoji: '💙',
    canvasBg: '#0d1b2a',
    gridColor: '#1b263b',
    sidebarBg: '#1b263b',
    sidebarBorder: '#243447',
    textPrimary: '#e0e1dd',
    textSecondary: '#8aa4c0',
    textFaint: '#4d6880',
    inputBg: '#0d1b2a',
    inputBorder: '#243447',
    nodeBg: '#162233',
    nodeBorder: 'rgba(72,202,228,0.15)',
    nodeText: '#e0e1dd',
    nodeTextMuted: '#8aa4c0',
    accentBg: '#1b3048',
    accentText: '#48cae4',
    ctaBg: '#48cae4',
    ctaText: '#0d1b2a',
    washiTape: '#1b3553',
    footerBg: '#132030',
    isDark: true,
  },
};

/**
 * Build a full CanvasTheme for the 'custom' preset using a user-supplied hex colour.
 * Derives a slightly darker tint for the grid and a slightly lighter tint for the sidebar.
 */
export function buildCustomTheme(hexBg: string): CanvasTheme {
  // Determine if the hex colour is "dark" (luminance < 0.4) for contrast decisions
  const r = parseInt(hexBg.slice(1, 3), 16) / 255;
  const g = parseInt(hexBg.slice(3, 5), 16) / 255;
  const b = parseInt(hexBg.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const dark = luminance < 0.45;

  // Derive a subtle grid colour by mixing towards black/white
  const mix = (channel: number, toward: number, amount: number) =>
    Math.round(channel * 255 * (1 - amount) + toward * amount)
      .toString(16)
      .padStart(2, '0');
  const gridHex =
    '#' +
    mix(r, dark ? 1 : 0, 0.12) +
    mix(g, dark ? 1 : 0, 0.12) +
    mix(b, dark ? 1 : 0, 0.12);

  const sidebarHex =
    '#' +
    mix(r, dark ? 1 : 0, 0.06) +
    mix(g, dark ? 1 : 0, 0.06) +
    mix(b, dark ? 1 : 0, 0.06);

  return {
    id: 'custom',
    label: 'Custom',
    emoji: '🎨',
    canvasBg: hexBg,
    gridColor: gridHex,
    sidebarBg: sidebarHex,
    sidebarBorder: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    textPrimary: dark ? '#f2f2f2' : '#1a1a1a',
    textSecondary: dark ? '#a0a8b8' : '#555555',
    textFaint: dark ? '#606878' : '#999999',
    inputBg: hexBg,
    inputBorder: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    nodeBg: dark ? sidebarHex : '#ffffff',
    nodeBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    nodeText: dark ? '#f2f2f2' : '#1a1a1a',
    nodeTextMuted: dark ? '#a0a8b8' : '#555555',
    accentBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    accentText: dark ? '#90cdf4' : '#2563eb',
    ctaBg: dark ? '#f2f2f2' : '#1a1a1a',
    ctaText: dark ? '#1a1a1a' : '#f2f2f2',
    washiTape: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    footerBg: dark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.04)',
    isDark: dark,
  };
}

export function getActiveTheme(themeId: ThemeId, customBgColor: string): CanvasTheme {
  if (themeId === 'custom') return buildCustomTheme(customBgColor);
  return THEMES[themeId];
}
