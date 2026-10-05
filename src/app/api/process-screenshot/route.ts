import { NextRequest, NextResponse } from 'next/server';
import { analyzeScreenshotWithOllama } from '@/lib/ollama';
import { saveScreenshot, getScreenshots, deleteScreenshot } from '@/lib/mongodb';
import { ScreenshotItem } from '@/types/journal';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { screenshot, instruction, position } = body;

    if (!screenshot || typeof screenshot !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid screenshot data. Base64 string required.' },
        { status: 400 }
      );
    }

    // 1. Send to Ollama (gemma:2b) and extract structured JSON (title, category, tags, summary)
    const { result, aiStatus } = await analyzeScreenshotWithOllama(screenshot, instruction);

    // 2. Build the item record
    const id = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newItem: ScreenshotItem = {
      id,
      title: result.title,
      category: result.category,
      tags: result.tags,
      summary: result.summary,
      screenshot,
      instruction: instruction?.trim() || undefined,
      createdAt: new Date().toISOString(),
      position: position || {
        x: Math.floor(Math.random() * 300) + 120,
        y: Math.floor(Math.random() * 250) + 100,
      },
      aiModel: 'gemma:2b',
      aiStatus,
    };

    // 3. Persist to MongoDB Atlas
    const { saved, source } = await saveScreenshot(newItem);

    return NextResponse.json({
      success: true,
      data: saved,
      storage: source,
      aiStatus,
      message: source === 'atlas' 
        ? 'Successfully saved to MongoDB Atlas' 
        : 'Saved to session store (Add MONGODB_URI to .env.local to persist directly to Atlas)',
    });
  } catch (error) {
    console.error('Error processing screenshot in /api/process-screenshot:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while processing screenshot' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { items, source } = await getScreenshots();
    return NextResponse.json({
      success: true,
      items,
      storage: source,
      count: items.length,
    });
  } catch (error) {
    console.error('Error fetching screenshots in /api/process-screenshot:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve screenshots from database' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing screenshot id parameter' }, { status: 400 });
    }

    const deleted = await deleteScreenshot(id);
    return NextResponse.json({ success: true, deleted, id });
  } catch (error) {
    console.error('Error deleting screenshot in /api/process-screenshot:', error);
    return NextResponse.json({ error: 'Failed to delete screenshot' }, { status: 500 });
  }
}
