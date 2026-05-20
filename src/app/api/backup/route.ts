import { NextRequest, NextResponse } from 'next/server';
import { isBackendAvailable, backendFetch } from '@/lib/backend-proxy';

// Mock 备份列表存储
const mockBackups: unknown[] = [];

// 生成模拟备份列表
function generateMockBackups() {
  const types = ['full', 'images', 'database', 'settings'];
  const backups = [];
  
  for (let i = 0; i < 5; i++) {
    backups.push({
      id: `backup-${Date.now()}-${i}`,
      name: `备份 ${new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}`,
      type: types[Math.floor(Math.random() * types.length)],
      size: Math.floor(Math.random() * 500000000) + 10000000,
      status: 'completed',
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return backups;
}

// 获取备份列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // 检查后端是否可用
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // 降级模式：返回模拟备份列表
      let backups = mockBackups.length > 0 ? mockBackups : generateMockBackups();
      
      // 分页
      const startIndex = (page - 1) * pageSize;
      const paginatedBackups = (backups as unknown[]).slice(startIndex, startIndex + pageSize);
      
      return NextResponse.json({
        success: true,
        backups: paginatedBackups,
        total: backups.length,
        page,
        pageSize,
        totalPages: Math.ceil(backups.length / pageSize),
        message: '降级模式 - 模拟数据',
      });
    }
    
    // 后端可用，调用后端 API
    const sessionId = request.cookies.get('session_id')?.value;

    const response = await backendFetch(`/backup/list?page=${page}&pageSize=${pageSize}`, {
      headers: {
        'X-Session-Id': sessionId || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get backup list error:', error);
    return NextResponse.json({ error: '获取备份列表失败' }, { status: 500 });
  }
}

// 创建备份
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'full', description = '' } = body;
    
    // 检查后端是否可用
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // 降级模式：模拟创建备份
      const backup = {
        id: `backup-${Date.now()}`,
        name: `备份 ${new Date().toLocaleDateString('zh-CN')}`,
        type,
        description,
        size: Math.floor(Math.random() * 500000000) + 10000000,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      
      mockBackups.unshift(backup);
      
      return NextResponse.json({
        success: true,
        backup,
        message: '备份创建成功（降级模式）',
      });
    }
    
    // 后端可用，调用后端 API
    const sessionId = request.cookies.get('session_id')?.value;

    const response = await backendFetch('/backup/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Create backup error:', error);
    return NextResponse.json({ error: '创建备份失败' }, { status: 500 });
  }
}

// 删除备份
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('backupId') || '';
    
    // 检查后端是否可用
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // 降级模式：模拟删除备份
      const index = mockBackups.findIndex((b: unknown) => (b as { id: string }).id === backupId);
      if (index !== -1) {
        mockBackups.splice(index, 1);
      }
      
      return NextResponse.json({
        success: true,
        message: '备份删除成功（降级模式）',
      });
    }
    
    // 后端可用，调用后端 API
    const sessionId = request.cookies.get('session_id')?.value;

    const response = await backendFetch(`/backup/${backupId}`, {
      method: 'DELETE',
      headers: {
        'X-Session-Id': sessionId || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete backup error:', error);
    return NextResponse.json({ error: '删除备份失败' }, { status: 500 });
  }
}
