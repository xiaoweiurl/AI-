import { NextRequest, NextResponse } from 'next/server';

// 获取后端 API 地址
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8080';

/**
 * 批量删除相册 - 代理到后端
 * POST /api/albums/batch-delete
 * Body: { ids: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_API_URL}/api/albums/batch-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
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
