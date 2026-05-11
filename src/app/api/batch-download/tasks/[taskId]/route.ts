import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-proxy';

/**
 * @swagger
 * /api/batch-download/tasks/{taskId}:
 *   get:
 *     summary: 查询异步任务进度
 *     description: 根据任务ID查询批量下载任务的执行进度
 *     tags: [图片管理]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 任务进度查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 是否成功
 *                 data:
 *                   type: object
 *                   description: 任务信息
 *                   properties:
 *                     taskId:
 *                       type: string
 *                       description: 任务ID
 *                     status:
 *                       type: string
 *                       description: 任务状态 (pending/processing/completed/failed)
 *                     totalCount:
 *                       type: integer
 *                       description: 总数量
 *                     processedCount:
 *                       type: integer
 *                       description: 已处理数量
 *                     successCount:
 *                       type: integer
 *                       description: 成功数量
 *                     failCount:
 *                       type: integer
 *                       description: 失败数量
 *                     skipCount:
 *                       type: integer
 *                       description: 跳过数量
 *                     errorMessage:
 *                       type: string
 *                       description: 错误信息
 *       404:
 *         description: 任务不存在
 *       500:
 *         description: 系统异常
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const cookieHeader = request.headers.get('cookie') || '';

        console.log(`[API] 查询任务进度, taskId: ${taskId}`);

        const response = await backendFetch(`/images/batch-download/tasks/${taskId}`, {
            method: 'GET',
            requestHeaders: {
                cookie: cookieHeader,
            },
        });

        const data = await response.json();
        console.log(`[API] 任务进度响应:`, data);

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[API] 查询任务进度失败:', error);
        return NextResponse.json({
            success: false,
            message: '系统异常，请稍后重试',
        }, { status: 500 });
    }
}
