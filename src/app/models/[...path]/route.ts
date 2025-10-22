import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

// Serve static model files from the offline generator project under a stable /models/* URL
export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segments } = await context.params;
    const segs = segments || [];
    // Prevent path traversal
    const safeSegments = segs.filter(seg => !seg.includes('..') && !path.isAbsolute(seg));
    const baseDir = path.join(process.cwd(), 'generador-misiones-chatbot', 'public', 'models');
  const filePath = path.join(baseDir, ...safeSegments);

    // Ensure the resolved path stays within the base directory
    const normalizedBase = path.normalize(baseDir + path.sep);
    const normalizedTarget = path.normalize(filePath);
    if (!normalizedTarget.startsWith(normalizedBase)) {
      return new Response('Not found', { status: 404 });
    }

  const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    const contentType =
      ext === '.json' ? 'application/json; charset=utf-8' :
      ext === '.txt' ? 'text/plain; charset=utf-8' :
      ext === '.js' || ext === '.mjs' ? 'application/javascript; charset=utf-8' :
      'application/octet-stream';

    const body = new Uint8Array(data);
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    if (err && (err.code === 'ENOENT' || err.code === 'EISDIR')) {
      return new Response('Not found', { status: 404 });
    }
    console.error('Error serving model asset:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
