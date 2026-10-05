import { ScreenshotItem } from '@/types/journal';

// Global memory cache to persist items during development session
declare global {
  // eslint-disable-next-line no-var
  var __memoryScreenshots: ScreenshotItem[] | undefined;
}

if (!global.__memoryScreenshots) {
  global.__memoryScreenshots = [];
}

export const memoryStore = {
  getAll: (): ScreenshotItem[] => {
    return global.__memoryScreenshots || [];
  },

  get: (id: string): ScreenshotItem | null => {
    if (!global.__memoryScreenshots) return null;
    return global.__memoryScreenshots.find((item) => item.id === id) || null;
  },

  insert: (item: ScreenshotItem): ScreenshotItem => {
    if (!global.__memoryScreenshots) {
      global.__memoryScreenshots = [];
    }
    // Prepend new item
    global.__memoryScreenshots.unshift(item);
    return item;
  },

  delete: (id: string): boolean => {
    if (!global.__memoryScreenshots) return false;
    const initialLength = global.__memoryScreenshots.length;
    global.__memoryScreenshots = global.__memoryScreenshots.filter((item) => item.id !== id);
    return global.__memoryScreenshots.length < initialLength;
  },

  updatePosition: (id: string, position: { x: number; y: number }): boolean => {
    if (!global.__memoryScreenshots) return false;
    const target = global.__memoryScreenshots.find((item) => item.id === id);
    if (target) {
      target.position = position;
      return true;
    }
    return false;
  }
};
