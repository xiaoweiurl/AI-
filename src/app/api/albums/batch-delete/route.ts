import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/api-utils';

/**
 * 批量删除相册 - 代理到后端
 * POST /api/albums/batch-delete
 * Body: { ids: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await backendRequest(request, '/albums/batch-delete', {
      method: 'POST',
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
