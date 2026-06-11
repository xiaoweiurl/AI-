import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, isBackendAvailable } from '@/lib/backend-proxy';

// GET /api/auth/session - 验证登录状态
export async function GET(request: NextRequest) {
  try {
    const isAvailable = await isBackendAvailable();
    
    if (!isAvailable) {
      // 降级模式：检查本地 cookie
      const sessionId = request.cookies.get('session_id')?.value;
      if (sessionId) {
        return NextResponse.json({
          success: true,
          data: {
            username: 'admin',
            role: 'admin',
            sessionId
          }
        });
      }
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    // 转发到 Java 后端 /api/auth/session
    const cookie = request.headers.get('cookie') || '';
    const response = await backendFetch('/auth/session', {
      method: 'GET',
      requestHeaders: { cookie },
    });

    const data = await response.json();
    
    // 如果后端返回了 sessionId，更新 cookie
    if (data.success || data.code === 200) {
      const sessionData = data.data || data;
      const sessionId = sessionData.sessionId || sessionData.session_id;
      if (sessionId) {
        const res = NextResponse.json(data);
        res.cookies.set('session_id', sessionId, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
        return res;
      }
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API] 验证session失败:', error);
    
    // 降级模式
    const sessionId = request.cookies.get('session_id')?.value;
    if (sessionId) {
      return NextResponse.json({
        success: true,
        data: {
          username: 'admin',
          role: 'admin',
          sessionId
        }
      });
    }
    return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
  }
}
