import { NextRequest, NextResponse } from 'next/server';

/**
 * 通用后端 API 代理
 * 
 * 动态识别后端地址：
 * 1. 优先使用环境变量 BACKEND_API_URL（非 NEXT_PUBLIC_ 前缀，仅在服务端可用）
 * 2. 其次使用 NEXT_PUBLIC_BACKEND_API_URL
 * 3. 默认 http://localhost:8080/api（本地开发）
 * 
 * 前端统一走 /api/proxy/... 同源路径，避免 CORS 和 Private Network Access 问题
 */

function getBackendUrl(): string {
  // 服务端环境变量（优先）
  if (process.env.BACKEND_API_URL) return process.env.BACKEND_API_URL;
  if (process.env.NEXT_PUBLIC_BACKEND_API_URL) return process.env.NEXT_PUBLIC_BACKEND_API_URL;
  return 'http://localhost:8080/api';
}

async function proxyRequest(request: NextRequest, method: string) {
  const BACKEND_URL = getBackendUrl();
  
  try {
    // 构建后端 URL：/api/proxy/auth/login → http://localhost:8080/api/auth/login
    const path = request.nextUrl.pathname.replace('/api/proxy', '');
    const searchParams = request.nextUrl.search;
    const backendUrl = `${BACKEND_URL}${path}${searchParams}`;

    // 复制请求头，过滤掉 Next.js/代理相关的头（避免后端拒绝）
    const headers = new Headers();
    const skipHeaders = new Set([
      'host', 'connection', 'content-length', 'transfer-encoding',
      'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host',
      'x-real-ip', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor',
      'x-middleware-request-', 'x-nextjs-data', 'x-invoke-output',
      'x-invoke-path', 'x-invoke-query', 'rsc', 'next-url',
    ]);
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!skipHeaders.has(lowerKey) && !lowerKey.startsWith('x-middleware')) {
        headers.set(key, value);
      }
    });

    // 设置正确的 Host 头（匹配后端地址）
    try {
      const backendHost = new URL(BACKEND_URL).host;
      headers.set('Host', backendHost);
    } catch {
      // ignore
    }

    // 确保 X-Session-Id 传递（从 cookie 或 header）
    const sessionIdFromCookie = request.cookies.get('session_id')?.value;
    if (sessionIdFromCookie && !headers.has('x-session-id')) {
      headers.set('X-Session-Id', sessionIdFromCookie);
    }

    // 构建请求选项
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const fetchOptions: RequestInit = {
      method,
      headers,
      redirect: 'manual',
      signal: controller.signal,
    };

    // 非 GET/HEAD 请求传递 body
    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('multipart/form-data')) {
        // FormData：直接透传原始 body
        fetchOptions.body = await request.arrayBuffer();
        // multipart 不设 Content-Type，让浏览器自动加 boundary
        headers.delete('content-type');
      } else if (contentType.includes('application/json') || contentType.includes('text/')) {
        fetchOptions.body = await request.text();
      } else {
        fetchOptions.body = await request.arrayBuffer();
      }
    }

    console.log(`[Proxy] ${method} → ${backendUrl}`);

    const backendResponse = await fetch(backendUrl, fetchOptions);
    clearTimeout(timeoutId);

    console.log(`[Proxy] ← ${backendResponse.status} ${backendResponse.statusText}`);

    // 构建响应头
    const responseHeaders = new Headers();
    const responseSkipHeaders = new Set([
      'transfer-encoding', 'connection', 'keep-alive',
    ]);
    backendResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!responseSkipHeaders.has(lowerKey)) {
        responseHeaders.set(key, value);
      }
    });

    // 处理 SSE 流式响应
    const responseContentType = backendResponse.headers.get('content-type') || '';
    if (responseContentType.includes('text/event-stream')) {
      return new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        headers: responseHeaders,
      });
    }

    // 普通响应
    const responseBody = await backendResponse.arrayBuffer();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const BACKEND = getBackendUrl();
    const errMsg = error instanceof Error ? error.message : '代理请求失败';
    console.error(`[Proxy] 请求转发失败 (${BACKEND}):`, errMsg);
    return NextResponse.json(
      { 
        success: false, 
        error: `后端服务不可用 (${BACKEND}): ${errMsg}`, 
        message: '后端服务不可用，请确认 Java 后端已启动' 
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}
