import { NextRequest, NextResponse } from 'next/server';

/**
 * 通用后端 API 代理
 * 
 * 关键功能：
 * 1. 转发所有 HTTP 请求到 Java 后端
 * 2. 自动改写响应中的 localhost:8080 URL 为相对路径（彻底解决映射端口 CORS 问题）
 * 3. SSE 流式响应透传
 * 4. 动态探测后端地址
 */

// 后端地址探测结果缓存
let cachedBackendUrl: string | null = null;
let lastProbeTime = 0;
const PROBE_CACHE_TTL = 60000; // 1分钟缓存

/**
 * 根据请求来源获取可能的后端地址列表
 */
function getBackendCandidates(request: NextRequest): string[] {
  const candidates: string[] = [];
  
  // 1. 环境变量优先
  if (process.env.BACKEND_API_URL) {
    candidates.push(process.env.BACKEND_API_URL);
  }
  if (process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    candidates.push(process.env.NEXT_PUBLIC_BACKEND_API_URL);
  }
  
  // 2. 根据 Host 头判断
  const host = request.headers.get('host') || '';
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0');
  
  if (isLocalhost) {
    candidates.push('http://localhost:8080/api');
  } else {
    const hostname = host.split(':')[0];
    candidates.push(`http://${hostname}/api`);
    candidates.push(`http://${hostname}:8080/api`);
    candidates.push('http://localhost:8080/api');
    candidates.push(`https://${hostname}/api`);
  }
  
  return [...new Set(candidates)];
}

/**
 * 探测可用的后端地址
 */
async function probeBackend(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch(`${url}/albums`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取可用的后端地址（带缓存）
 */
async function getAvailableBackend(request: NextRequest): Promise<string | null> {
  const now = Date.now();
  
  if (cachedBackendUrl && (now - lastProbeTime) < PROBE_CACHE_TTL) {
    return cachedBackendUrl;
  }
  
  const candidates = getBackendCandidates(request);
  
  for (const url of candidates) {
    const available = await probeBackend(url);
    if (available) {
      cachedBackendUrl = url;
      lastProbeTime = now;
      console.log(`[Proxy] 后端可用: ${url}`);
      return url;
    }
    console.log(`[Proxy] 后端不可用: ${url}`);
  }
  
  console.error('[Proxy] 所有后端地址均不可用');
  return null;
}

/**
 * 改写响应体中的 localhost:8080 URL 为相对路径
 * 
 * http://localhost:8080/api/uploads/images/xxx.jpg → /api/uploads/images/xxx.jpg
 * http://localhost:8080/api/xxx → /api/xxx
 * 
 * 这样前端拿到的永远是相对路径，浏览器请求同域，由 Next.js rewrites 或 proxy 转发
 */
function rewriteResponseBody(body: string): string {
  // 匹配 http://localhost:8080 或 http://127.0.0.1:8080
  return body.replace(/https?:\/\/(?:localhost|127\.0\.0\.1):8080/g, '');
}

async function proxyRequest(request: NextRequest, method: string) {
  const backendUrl = await getAvailableBackend(request);
  
  if (!backendUrl) {
    const candidates = getBackendCandidates(request);
    return NextResponse.json(
      {
        success: false,
        error: `后端服务不可用，已尝试: ${candidates.join(', ')}`,
        message: '后端服务不可用，请确认 Java 后端已启动'
      },
      { status: 502 }
    );
  }
  
  try {
    const path = request.nextUrl.pathname.replace('/api/proxy', '');
    const searchParams = request.nextUrl.search;
    const targetUrl = `${backendUrl}${path}${searchParams}`;

    // 复制请求头
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

    try {
      const backendHost = new URL(backendUrl).host;
      headers.set('Host', backendHost);
    } catch {}

    const sessionIdFromCookie = request.cookies.get('session_id')?.value;
    if (sessionIdFromCookie && !headers.has('x-session-id')) {
      headers.set('X-Session-Id', sessionIdFromCookie);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const fetchOptions: RequestInit = {
      method,
      headers,
      redirect: 'manual',
      signal: controller.signal,
    };

    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('multipart/form-data')) {
        fetchOptions.body = await request.arrayBuffer();
        headers.delete('content-type');
      } else if (contentType.includes('application/json') || contentType.includes('text/')) {
        fetchOptions.body = await request.text();
      } else {
        fetchOptions.body = await request.arrayBuffer();
      }
    }

    console.log(`[Proxy] ${method} → ${targetUrl}`);

    const backendResponse = await fetch(targetUrl, fetchOptions);
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

    // SSE 流式响应：直接透传，不改写
    const responseContentType = backendResponse.headers.get('content-type') || '';
    if (responseContentType.includes('text/event-stream')) {
      return new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        headers: responseHeaders,
      });
    }

    // 普通响应：改写响应体中的 localhost URL
    const responseBody = await backendResponse.arrayBuffer();
    const contentType = backendResponse.headers.get('content-type') || '';
    
    if (contentType.includes('application/json') || contentType.includes('text/')) {
      // 文本/JSON 响应：改写 localhost URL
      const bodyText = new TextDecoder().decode(responseBody);
      const rewrittenBody = rewriteResponseBody(bodyText);
      
      return new NextResponse(rewrittenBody, {
        status: backendResponse.status,
        headers: responseHeaders,
      });
    }
    
    // 二进制响应（图片等）：直接返回
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    cachedBackendUrl = null;
    lastProbeTime = 0;
    
    const errMsg = error instanceof Error ? error.message : '代理请求失败';
    console.error(`[Proxy] 请求转发失败:`, errMsg);
    return NextResponse.json(
      {
        success: false,
        error: `后端请求失败: ${errMsg}`,
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
