import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/api-utils';

interface ApiResult {
  success: boolean;
  message?: string;
  data?: unknown;
  code?: number;
}

/**
 * 安全解析响应
 */
async function safeParseResponse(response: Response): Promise<{ result?: ApiResult; ok: boolean; status: number }> {
  const ok = response.ok;
  const status = response.status;
  
  const text = await response.text();
  
  if (!text) {
    return { ok, status, result: { success: true } };
  }
  
  try {
    const parsed = JSON.parse(text);
    return { ok, status, result: parsed };
  } catch {
    return { ok, status, result: { success: false, message: '解析响应失败' } };
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await backendRequest(request, '/albums/matching-mode/reset', {
      method: 'PUT'});

    const { result } = await safeParseResponse(response);

    return NextResponse.json({
      ...result,
      success: result?.code === 200 || result?.success === true,
    });
  } catch (error) {
    console.error('Reset matching mode failed:', error);
    return NextResponse.json(
      { success: false, message: 'Reset matching mode failed' },
      { status: 500 }
    );
  }
}
