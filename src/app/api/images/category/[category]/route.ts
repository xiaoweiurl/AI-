// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { categoryApi } from '@/lib/api-utils';

/**
 * GET - 根据分类获取图片列表
 * 代理到 Java 后端: GET /api/categories/{category}/images
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);
    const cookieHeader = request.headers.get('cookie') || '';
    
    const requestHeaders: Record<string, string | null> = {
      cookie: cookieHeader,
    };
    
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '40';
    
    const response = await categoryApi.get(decodedCategory, parseInt(page), parseInt(pageSize), requestHeaders);
    const result = await response.json();
    
    if (result.success && result.data) {
      const data = result.data as Record<string, unknown>;
      
      return NextResponse.json({
        success: true,
        data: {
          list: data.list || data.content || [],
          total: data.total || data.totalElements || 0,
          page: page,
          pageSize: pageSize,
        },
      });
    }
    
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('[API] 获取分类图片失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取分类图片失败' },
      { status: 500 }
    );
  }
}
