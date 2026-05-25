import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/api-utils';

/**
 * 批量替换主图
 * 把选中图片所属商品的第一张详情图批量设为主图
 */
export async function POST(request: NextRequest) {
    try {
        // 获取 session_id
        const cookieStore = request.cookies;
        const sessionId = cookieStore.get('session_id')?.value;
        
        console.log('[API] 批量替换主图 - sessionId:', sessionId ? `${sessionId.substring(0, 8)}...` : 'null');
        
        const body = await request.json();
        const { imageIds } = body;

        const response = await backendRequest(request, '/images/batch-replace-main-image', {
            method: 'POST',
            headers: sessionId ? { 'X-Session-Id': sessionId } : undefined,
            body: JSON.stringify({ imageIds }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[API] 批量替换主图失败:', error);
        return NextResponse.json({
            code: 500,
            message: '系统异常，请稍后重试',
            success: false,
        }, { status: 500 });
    }
}
