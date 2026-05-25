/**
 * 后端 API 代理工具
 * 自动检测 ngrok 等代理域名
 */

import { NextResponse } from 'next/server';
import { getBackendApiUrl } from './config/backend-url';

/**
 * 向后端发送请求
 * 自动处理认证头和错误响应
 */
export async function backendFetch(
  path: string,
  options: RequestInit = {},
  request?: Request
): Promise<Response> {
  // 从请求中获取 host（用于 SSR 环境检测 ngrok）
  let requestHost: string | undefined;
  if (request) {
    const host = request.headers.get('host') || '';
    const forwardedHost = request.headers.get('x-forwarded-host') || '';
    requestHost = forwardedHost || host;
  }
  
  const apiUrl = getBackendApiUrl(requestHost);
  const url = `${apiUrl}${path}`;
  
  // 从请求或 document.cookie 获取 session
  let sessionId = '';
  
  if (request) {
    // 服务端：从请求头获取
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionMatch = cookieHeader.match(/session_id=([^;]+)/);
    if (sessionMatch) {
      sessionId = sessionMatch[1];
    }
  } else if (typeof document !== 'undefined') {
    // 客户端：从 document.cookie 获取
    const sessionMatch = document.cookie.match(/session_id=([^;]+)/);
    if (sessionMatch) {
      sessionId = sessionMatch[1];
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }

  // 获取当前域名作为 Origin
  let origin = 'http://localhost:5000';
  if (typeof window !== 'undefined') {
    origin = window.location.origin;
  } else if (request) {
    origin = request.headers.get('origin') || 'http://localhost:5000';
  }
  headers['Origin'] = origin;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  return response;
}

/**
 * 向后端发送 FormData 请求
 */
export async function backendFetchFormData(
  path: string,
  formData: FormData,
  request?: Request
): Promise<Response> {
  // 从请求中获取 host（用于 SSR 环境检测 ngrok）
  let requestHost: string | undefined;
  if (request) {
    const host = request.headers.get('host') || '';
    const forwardedHost = request.headers.get('x-forwarded-host') || '';
    requestHost = forwardedHost || host;
  }
  
  const apiUrl = getBackendApiUrl(requestHost);
  const url = `${apiUrl}${path}`;
  
  // 从请求或 document.cookie 获取 session
  let sessionId = '';
  
  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionMatch = cookieHeader.match(/session_id=([^;]+)/);
    if (sessionMatch) {
      sessionId = sessionMatch[1];
    }
  } else if (typeof document !== 'undefined') {
    const sessionMatch = document.cookie.match(/session_id=([^;]+)/);
    if (sessionMatch) {
      sessionId = sessionMatch[1];
    }
  }

  const headers: HeadersInit = {};

  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }

  // 获取当前域名作为 Origin
  let origin = 'http://localhost:5000';
  if (typeof window !== 'undefined') {
    origin = window.location.origin;
  } else if (request) {
    origin = request.headers.get('origin') || 'http://localhost:5000';
  }
  headers['Origin'] = origin;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });

  return response;
}

/**
 * 向后端发送 JSON 请求
 */
export async function backendFetchJson<T>(
  path: string,
  options: RequestInit = {},
  request?: Request
): Promise<T> {
  const response = await backendFetch(path, options, request);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// 导出配置函数供其他模块使用
export { getBackendApiUrl, getBackendApiUrl as getApiBaseUrl, getBackendApiUrl as getBackendUrl } from './config/backend-url';

/**
 * 获取当前 Session ID
 */
export function getSessionId(request?: Request): string | null {
  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionMatch = cookieHeader.match(/session_id=([^;]+)/);
    return sessionMatch ? sessionMatch[1] : null;
  } else if (typeof document !== 'undefined') {
    const sessionMatch = document.cookie.match(/session_id=([^;]+)/);
    return sessionMatch ? sessionMatch[1] : null;
  }
  return null;
}

/**
 * 检查后端服务是否可用
 */
let backendAvailable: boolean | null = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // 30秒检查一次

export async function isBackendAvailable(requestHost?: string): Promise<boolean> {
  const now = Date.now();
  
  // 使用缓存结果（30秒内）
  if (backendAvailable !== null && (now - lastCheckTime) < CHECK_INTERVAL) {
    return backendAvailable;
  }
  
  try {
    const apiUrl = getBackendApiUrl(requestHost);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    backendAvailable = response.ok;
    lastCheckTime = now;
    return backendAvailable;
  } catch {
    backendAvailable = false;
    lastCheckTime = now;
    return false;
  }
}

/**
 * 处理后端响应，包括错误处理
 */
export async function handleBackendResponse(response: Response): Promise<NextResponse> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  // 复制响应头
  const headers = new Headers();
  
  // 复制 Set-Cookie 头
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    headers.set('Set-Cookie', setCookie);
  }
  
  // 复制其他必要的头
  const corsHeaders = ['access-control-allow-origin', 'access-control-allow-credentials'];
  corsHeaders.forEach(h => {
    const value = response.headers.get(h);
    if (value) {
      headers.set(h, value);
    }
  });
  
  if (isJson) {
    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers });
  } else {
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers });
  }
}

/**
 * 图片 API 封装
 */
export const imageApi = {
  async list(params: Record<string, string | number | boolean> = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return backendFetch(`/images?${searchParams.toString()}`);
  },
  
  async get(id: string) {
    return backendFetch(`/images/${id}`);
  },
  
  async upload(formData: FormData) {
    return backendFetchFormData('/images/upload', formData);
  },
  
  async delete(id: string) {
    return backendFetch(`/images/${id}`, { method: 'DELETE' });
  },
  
  async batchDelete(ids: string[]) {
    return backendFetch('/images/batch', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', ids }),
    });
  },
  
  async classify(imageId: string, albumId: string) {
    return backendFetch('/images/classify', {
      method: 'POST',
      body: JSON.stringify({ imageId, albumId }),
    });
  },
  
  async getTags() {
    return backendFetch('/images/tags');
  },
};

/**
 * AI API 封装
 */
export const aiApi = {
  async recognize(imageUrl: string) {
    return backendFetch('/ai/recognize', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });
  },
};

/**
 * 分类 API 封装
 */
export const categoryApi = {
  async list() {
    return backendFetch('/images/category');
  },
  
  async get(category: string) {
    return backendFetch(`/images/category/${category}`);
  },
};

/**
 * 管理员 API 封装
 */
export const adminApi = {
  async getUsers() {
    return backendFetch('/users');
  },
  
  async getUser(id: string) {
    return backendFetch(`/users/${id}`);
  },
  
  async updateUser(id: string, data: Record<string, unknown>) {
    return backendFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  async deleteUser(id: string) {
    return backendFetch(`/users/${id}`, { method: 'DELETE' });
  },
  
  async resetPassword(id: string, newPassword: string) {
    return backendFetch(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },
};

/**
 * 用户 API 封装
 */
export const userApi = {
  async getProfile() {
    return backendFetch('/user/profile');
  },
  
  async updateProfile(data: Record<string, unknown>) {
    return backendFetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  async getSettings() {
    return backendFetch('/user/settings');
  },
  
  async updateSettings(data: Record<string, unknown>) {
    return backendFetch('/user/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  async getNotifications() {
    return backendFetch('/notifications');
  },
  
  async markNotificationRead(id: string) {
    return backendFetch(`/notifications/${id}/read`, { method: 'POST' });
  },
  
  async markAllNotificationsRead() {
    return backendFetch('/notifications/read-all', { method: 'POST' });
  },
};
