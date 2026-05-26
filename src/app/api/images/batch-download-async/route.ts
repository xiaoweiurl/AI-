import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend-proxy';

/**
 * @swagger
 * /api/images/batch-download-async:
 *   post:
 *     summary: 异步批量下载网络图片
 *     description: 提交异步批量下载任务，立即返回任务ID，前端轮询查询进度
 *     tags: [图片管理]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 description: 图片列表
 *                 items:
 *                   type: object
 *                   properties:
 *                     productName:
 *                       type: string
 *                       description: 商品名称
 *                     mainImageUrl:
 *                       type: string
 *                       description: 主图URL
 *                     detailImageUrls:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 详情图URL列表
 *                     category:
 *                       type: string
 *                       description: 分类
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: 任务提交成功
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
 *                   properties:
 *                     taskId:
 *                       type: string
 *                       description: 任务ID
 *                     status:
 *                       type: string
 *                       description: 任务状态
 *       500:
 *         description: 系统异常
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie') || '';
    
    console.log('[API] 异步批量下载请求:', body);
    
    const response = await backendFetch('/images/batch-download/tasks', {
      method: 'POST',
      body: body,
      requestHeaders: {
        cookie: cookieHeader,
      },
    });
    
    const data = await response.json();
    console.log('[API] 异步批量下载响应:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] 异步批量下载失败:', error);
    return NextResponse.json({
      success: false,
      message: '系统异常，请稍后重试',
    }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/images/batch-download-async:
 *   get:
 *     summary: 查询异步批量下载任务进度
 *     description: 根据任务ID查询异步批量下载任务的进度
 *     tags: [图片管理]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       500:
 *         description: 系统异常
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const cookieHeader = request.headers.get('cookie') || '';

    if (!taskId) {
      return NextResponse.json({
        success: false,
        message: '任务ID不能为空',
      }, { status: 400 });
    }

    console.log('[API] 查询任务进度, taskId:', taskId);

    const response = await backendFetch(`/images/batch-download/tasks/${taskId}`, {
      method: 'GET',
      requestHeaders: {
        cookie: cookieHeader,
      },
    });

    const data = await response.json();
    console.log('[API] 查询任务进度响应:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] 查询任务进度失败:', error);
    return NextResponse.json({
      success: false,
      message: '系统异常，请稍后重试',
    }, { status: 500 });
  }
}
