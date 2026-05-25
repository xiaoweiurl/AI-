// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/api-utils';

/**
 * GET - 获取所有用户列表（管理员）
 */
export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string | null> = {
      'cookie': request.headers.get('cookie'),
      'x-session-id': request.headers.get('x-session-id'),
    };
    const response = await backendRequest(request, '/admin/users', { requestHeaders: headers });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('[API] 获取用户列表失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取用户列表失败' },
      { status: 500 }
    );
  }
}
