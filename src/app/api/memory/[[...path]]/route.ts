import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080/api';

function getSessionId(request: NextRequest): string | null {
  const headerSession = request.headers.get('x-session-id');
  if (headerSession) return headerSession;
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const match = cookies.match(/session_id=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

// GET 代理 - 支持 SSE 流式响应（chat 接口）
export async function GET(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const url = new URL(request.url);
  const { pathname, search } = url;
  const path = pathname.replace('/api/memory', '');

  const isSSE = pathname.includes('/chat');
  const backendUrl = `${getBackendUrl()}/memory${path}${search}`;

  try {
    const backendRes = await fetch(backendUrl, {
      headers: {
        'X-Session-Id': sessionId,
        'Accept': isSSE ? 'text/event-stream' : 'application/json',
      },
      // SSE 需要较长超时
      signal: isSSE ? AbortSignal.timeout(300000) : AbortSignal.timeout(15000),
    });

    if (isSSE) {
      // SSE 流式响应：直接透传
      const stream = backendRes.body;
      if (!stream) {
        return NextResponse.json({ error: '无法读取流' }, { status: 500 });
      }

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('[Memory Proxy] GET 请求失败:', error);
    return NextResponse.json({ error: '后端服务不可用' }, { status: 503 });
  }
}

// POST 代理 - 支持文件上传
export async function POST(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/memory', '');
  const backendUrl = `${getBackendUrl()}/memory${path}`;

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // 文件上传
      const formData = await request.formData();
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'X-Session-Id': sessionId },
        body: formData,
        signal: AbortSignal.timeout(60000), // 上传超时60秒
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // JSON 请求
    const body = await request.json();
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'X-Session-Id': sessionId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[Memory Proxy] POST 请求失败:', error);
    return NextResponse.json({ error: '后端服务不可用' }, { status: 503 });
  }
}

// PUT 代理
export async function PUT(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/memory', '');

  try {
    const body = await request.json();
    const res = await fetch(`${getBackendUrl()}/memory${path}`, {
      method: 'PUT',
      headers: {
        'X-Session-Id': sessionId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[Memory Proxy] PUT 请求失败:', error);
    return NextResponse.json({ error: '后端服务不可用' }, { status: 503 });
  }
}

// DELETE 代理
export async function DELETE(request: NextRequest) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api/memory', '');

  try {
    const res = await fetch(`${getBackendUrl()}/memory${path}`, {
      method: 'DELETE',
      headers: { 'X-Session-Id': sessionId },
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[Memory Proxy] DELETE 请求失败:', error);
    return NextResponse.json({ error: '后端服务不可用' }, { status: 503 });
  }
}
