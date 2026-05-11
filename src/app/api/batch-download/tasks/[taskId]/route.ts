import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-proxy';

/**
 * GET /api/batch-download/tasks/[taskId] - 获取任务进度
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const sessionId = request.headers.get('x-session-id') || 
                      request.cookies.get('session_id')?.value;

    const response = await backendFetch(`/batch-download/tasks/${taskId}`, {
      method: 'GET',
      requestHeaders: {
        'x-session-id': sessionId ?? null,
      },
    });

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('获取任务进度失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: '获取任务进度失败' 
    }, { status: 500 });
  }
}
