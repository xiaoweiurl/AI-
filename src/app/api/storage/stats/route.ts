import { NextRequest, NextResponse } from 'next/server';
import { isBackendAvailable, backendFetch } from '@/lib/backend-proxy';

// 获取存储统计
export async function GET(request: NextRequest) {
  try {
    // 检查后端是否可用
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // 降级模式：返回模拟存储统计数据
      const mockStats = {
        totalSpace: 10 * 1024 * 1024 * 1024, // 10 GB
        usedSpace: 2.5 * 1024 * 1024 * 1024, // 2.5 GB
        freeSpace: 7.5 * 1024 * 1024 * 1024, // 7.5 GB
        usedPercentage: 25,
        quota: {
          maxStorage: 10 * 1024 * 1024 * 1024,
          maxImages: 10000,
          currentImages: 1250,
        },
        breakdown: {
          images: 1.8 * 1024 * 1024 * 1024,
          documents: 0.5 * 1024 * 1024 * 1024,
          others: 0.2 * 1024 * 1024 * 1024,
        },
        message: '降级模式 - 模拟数据',
      };
      
      return NextResponse.json({ success: true, ...mockStats });
    }
    
    // 后端可用，调用后端 API
    const sessionId = request.cookies.get('session_id')?.value;

    const response = await backendFetch('/storage/stats', {
      headers: {
        'X-Session-Id': sessionId || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get storage stats error:', error);
    return NextResponse.json({ error: '获取存储统计失败' }, { status: 500 });
  }
}

// 更新存储配额（管理员）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 检查后端是否可用
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      return NextResponse.json({ 
        success: true, 
        message: '配额更新成功（降级模式）' 
      });
    }
    
    const sessionId = request.cookies.get('session_id')?.value;

    const response = await backendFetch('/storage/quota', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Update storage quota error:', error);
    return NextResponse.json({ error: '更新存储配额失败' }, { status: 500 });
  }
}
