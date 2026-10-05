import { NextRequest, NextResponse } from 'next/server';
import { updateScreenshot } from '@/lib/mongodb';
import { UpdateScreenshotRequest } from '@/types/journal';

export async function POST(request: NextRequest) {
  try {
    const body: UpdateScreenshotRequest = await request.json();
    const { id, title, category, tags, summary } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await updateScreenshot({ id, title, category, tags, summary });

    if (!result.updated) {
      return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 });
    }

    return NextResponse.json({ updated: result.updated, source: result.source });
  } catch (error) {
    console.error('Update screenshot error:', error);
    return NextResponse.json({ error: 'Failed to update screenshot' }, { status: 500 });
  }
}
