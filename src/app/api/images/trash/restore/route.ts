import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, handleBackendResponse } from '@/lib/backend-proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionId = cookieHeader.match(/session_id=([^;]+)/)?.[1];

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionId) headers['X-Session-Id'] = sessionId;

    const response = await backendFetch('/images/trash/restore', {
      method: 'POST',
      body: body,
      requestHeaders: { cookie: cookieHeader },
    });
    const result = await handleBackendResponse(response);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('[API] 恢复图片失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '恢复图片失败' },
      { status: 500 }
    );
  }
}
