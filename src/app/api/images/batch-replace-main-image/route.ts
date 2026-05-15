import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-proxy';

/**
 * 批量替换主图
 * 把指定显示顺序的详情图批量设为主图
 */
export async function POST(request: NextRequest) {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        const { searchParams } = new URL(request.url);
        const displayOrder = searchParams.get('displayOrder') || '1';

        const response = await backendFetch(`/images/batch-replace-main-image?displayOrder=${displayOrder}`, {
            method: 'POST',
            requestHeaders: {
                cookie: cookieHeader,
            },
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
