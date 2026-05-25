// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/api-utils';

/**
 * POST - 批量删除图片
 * 代理到 Java 后端: POST /api/images/delete
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageIds, permanent } = body;
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择要删除的图片' },
        { status: 400 }
      );
    }
    
    const response = await backendRequest(request, '/images/delete', {
      method: 'POST',
      body: { imageIds, permanent }});
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('[API] 删除图片失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除图片失败' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - 批量删除图片（兼容前端调用）
 * 代理到 Java 后端: POST /api/images/delete
 */
export async function PATCH(request: NextRequest) {
  return POST(request);
}
