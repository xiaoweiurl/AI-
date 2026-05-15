import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-proxy';

/**
 * 批量替换主图
 * 把选中图片所属商品的第一张详情图批量设为主图
 */
export async function POST(request: NextRequest) {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        const body = await request.json();
        const { imageIds } = body;

        const response = await backendFetch('/images/batch-replace-main-image', {
            method: 'POST',
            requestHeaders: {
                cookie: cookieHeader,
            },
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
