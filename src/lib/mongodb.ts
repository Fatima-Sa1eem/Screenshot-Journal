import { MongoClient, Db } from 'mongodb';
import { ScreenshotItem } from '@/types/journal';
import { memoryStore } from './storage';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'screenshot_journal';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
} else {
  // Informative log in development
  console.info('ℹ️ Note: MONGODB_URI is not set. Using local memory store. Set MONGODB_URI in .env.local to persist directly to MongoDB Atlas.');
}

export async function getDatabase(): Promise<Db | null> {
  if (!uri || !clientPromise) {
    return null;
  }
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName);
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error);
    return null;
  }
}

export async function saveScreenshot(item: ScreenshotItem): Promise<{ saved: ScreenshotItem; source: 'atlas' | 'memory' }> {
  try {
    const db = await getDatabase();
    if (db) {
      const collection = db.collection<ScreenshotItem>('screenshots');
      await collection.updateOne(
        { id: item.id },
        { $set: item },
        { upsert: true }
      );
      return { saved: item, source: 'atlas' };
    }
  } catch (err) {
    console.warn('MongoDB Atlas write failed, saving to local session store:', err);
  }

  // Fallback to memory store
  const saved = memoryStore.insert(item);
  return { saved, source: 'memory' };
}

export async function getScreenshots(): Promise<{ items: ScreenshotItem[]; source: 'atlas' | 'memory' }> {
  try {
    const db = await getDatabase();
    if (db) {
      const collection = db.collection<ScreenshotItem>('screenshots');
      const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
      // Map MongoDB docs to ScreenshotItem type cleanly
      const items: ScreenshotItem[] = docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        tags: doc.tags || [],
        summary: doc.summary,
        screenshot: doc.screenshot,
        instruction: doc.instruction,
        createdAt: doc.createdAt,
        position: doc.position || { x: 0, y: 0 },
        aiModel: doc.aiModel,
        aiStatus: doc.aiStatus,
      }));
      return { items, source: 'atlas' };
    }
  } catch (err) {
    console.warn('MongoDB Atlas read failed, reading from local session store:', err);
  }

  return { items: memoryStore.getAll(), source: 'memory' };
}

export async function deleteScreenshot(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    if (db) {
      const collection = db.collection<ScreenshotItem>('screenshots');
      const res = await collection.deleteOne({ id });
      return res.deletedCount > 0;
    }
  } catch (err) {
    console.warn('MongoDB Atlas delete failed:', err);
  }

  return memoryStore.delete(id);
}
