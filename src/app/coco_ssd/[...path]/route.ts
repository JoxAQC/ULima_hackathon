import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segments } = await context.params;
    const segs = segments || [];
    const safeSegments = segs.filter(seg => !seg.includes('..') && !path.isAbsolute(seg));
    const baseDir = path.join(process.cwd(), 'validador-materiales', 'public', 'models', 'coco_ssd');
    const filePath = path.join(baseDir, ...safeSegments);
    const normalizedBase = path.normalize(baseDir + path.sep);
    const normalizedTarget = path.normalize(filePath);
    if (!normalizedTarget.startsWith(normalizedBase)) {
      return new Response('Not found', { status: 404 });
    }
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.tflite' ? 'application/octet-stream'
      : ext === '.json' ? 'application/json; charset=utf-8'
      : 'application/octet-stream';
    return new Response(new Uint8Array(data), { status: 200, headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch (err: any) {
    if (err?.code === 'ENOENT') return new Response('Not found', { status: 404 });
    console.error('Error serving coco_ssd asset:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
