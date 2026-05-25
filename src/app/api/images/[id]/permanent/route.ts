import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/api-utils';

/**
 * DELETE - 永久删除图片
 * 代理到 Java 后端: DELETE /api/images/{id}/permanent
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie') || '';
    
    const response = await backendRequest(request, `/images/${id}/permanent`, {
      method: 'DELETE'});
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('[API] 永久删除图片失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '永久删除失败' },
      { status: 500 }
    );
  }
}
