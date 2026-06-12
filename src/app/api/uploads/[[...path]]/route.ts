import { NextRequest, NextResponse } from 'next/server';

/**
 * 图片/静态资源代理
 * 
 * 将 /api/uploads/xxx.jpg 请求转发到 http://localhost:8080/api/uploads/xxx.jpg
 * 这样前端用相对路径 <img src="/api/uploads/xxx.jpg">，浏览器同源请求无 CORS 问题
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
      headers: {
        'Accept': 'image/*, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new NextResponse('Not Found', { status: response.status });
    }

    const body = await response.arrayBuffer();
    const headers = new Headers();
    
    // 透传 Content-Type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    
    // 透传 Content-Length
    if (body.byteLength) {
      headers.set('Content-Length', String(body.byteLength));
    }
    
    // 缓存控制：图片缓存1小时
    headers.set('Cache-Control', 'public, max-age=3600');
    
    // 允许跨域（以防万一）
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error(`[Uploads Proxy] 请求失败: ${targetUrl}`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
