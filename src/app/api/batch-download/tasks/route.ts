import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-proxy';

/**
 * POST /api/batch-download/tasks - 提交异步批量下载任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = request.headers.get('x-session-id') || 
                      request.cookies.get('session_id')?.value;

    const response = await backendFetch('/batch-download/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId && { 'X-Session-Id': sessionId }),
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('提交异步任务失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: '提交任务失败' 
    }, { status: 500 });
  }
}
