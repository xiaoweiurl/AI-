import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/lib/backend-proxy';

// 获取后端 API 地址
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

/**
 * 批量删除相册 - 代理到后端
 * POST /api/albums/batch-delete
 * Body: { ids: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 获取 sessionId（从 cookie 中提取）
    const sessionId = getSessionId({
      'cookie': request.headers.get('cookie') || '',
      'x-session-id': request.headers.get('x-session-id') || '',
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // 添加 sessionId 到请求头
    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }
    
    const response = await fetch(`${BACKEND_API_URL}/api/albums/batch-delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Batch delete album error:', error);
    return NextResponse.json(
      { success: false, message: '批量删除失败' },
      { status: 500 }
    );
  }
}
