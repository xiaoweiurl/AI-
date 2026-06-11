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

export async function GET(request: NextRequest) {
  const sessionId = getSessionId(request);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionId) headers['X-Session-Id'] = sessionId;

    const backendRes = await fetch(`${getBackendUrl()}/documents/stats`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ error: '后端服务不可用' }, { status: 503 });
  }
}
