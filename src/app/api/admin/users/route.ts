import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, handleBackendResponse } from '@/lib/backend-proxy';

/**
 * 从请求中提取 sessionId（支持 cookie 和 header）
 */
function extractSessionId(request: NextRequest): Record<string, string | null> {
  const xSessionId = request.headers.get('x-session-id');
  if (xSessionId) {
    return { 'x-session-id': xSessionId, 'cookie': null };
  }
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionIdMatch = cookieHeader.match(/session_id=([^;]+)/);
  if (sessionIdMatch) {
    return { 'x-session-id': sessionIdMatch[1], 'cookie': cookieHeader };
  }
  return { 'x-session-id': null, 'cookie': cookieHeader };
}

/**
 * GET - 获取所有用户列表（管理员）
 */
export async function GET(request: NextRequest) {
  try {
    const headers = extractSessionId(request);
    const response = await backendFetch('/admin/users', { requestHeaders: headers });
    const result = await handleBackendResponse(response);
    
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('[API] 获取用户列表失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取用户列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST - 创建新用户（管理员）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = extractSessionId(request);
    const response = await backendFetch('/admin/users', {
      method: 'POST',
      body,
      requestHeaders: headers,
    });
    const result = await handleBackendResponse(response);
    
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('[API] 创建用户失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建用户失败' },
      { status: 500 }
    );
  }
}
