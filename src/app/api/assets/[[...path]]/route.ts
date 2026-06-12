import { NextRequest, NextResponse } from 'next/server';

/**
 * 资源文件代理
 * 
 * 将 /api/assets/xxx 请求转发到 http://localhost:8080/api/assets/xxx
 */

function getBackendBaseUrl(): string {
  return process.env.BACKEND_API_URL 
    || process.env.NEXT_PUBLIC_BACKEND_API_URL 
    || 'http://localhost:8080/api';
}

export async function GET(request: NextRequest) {
  const backendBase = getBackendBaseUrl();
  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.search;
  const targetUrl = `${backendBase.replace('/api', '')}${path}${searchParams}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new NextResponse('Not Found', { status: response.status });
    }

    const body = await response.arrayBuffer();
    const headers = new Headers();
    
    const contentType = response.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    
    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error(`[Assets Proxy] 请求失败: ${targetUrl}`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
