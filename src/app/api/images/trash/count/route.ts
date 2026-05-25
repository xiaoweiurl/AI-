import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/api-utils';

/**
 * @swagger
 * /api/images/trash/count:
 *   get:
 *     summary: 获取回收站主图数量
 *     description: 获取回收站中主图的数量
 *     tags: [图片管理]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: 成功获取回收站主图数量
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: integer
 *                   example: 42
 *       500:
 *         description: 服务器错误
 */
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    const response = await backendRequest(request, '/images/trash/count', {
      });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('[API] 获取回收站数量失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取回收站数量失败' },
      { status: 500 }
    );
  }
}
