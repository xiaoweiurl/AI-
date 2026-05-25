/**
 * API 工具库
 * 提供统一的请求验证、错误处理、安全检查等基础设施
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerBackendUrl } from './config/backend-url';

// ==========================================
// 安全配置
// ==========================================

export const SECURITY_CONFIG = {
  // 允许的后端域名白名单（生产环境应从环境变量读取）
  get allowedBackendOrigins() {
    const serverUrl = getServerBackendUrl();
    // 提取 origin（去掉 /api 后缀）
    const origin = serverUrl.replace(/\/api$/, '');
    return process.env.NODE_ENV === 'production'
      ? [origin]
      : [origin, 'http://localhost:8080', 'http://127.0.0.1:8080'];
  },
  
  // 允许的图片域名白名单
  allowedImageOrigins: [
    'lf-coze-web-cdn.coze.cn',
    'images.unsplash.com',
    'coze-coding-project.tos.coze.site',
    'code.coze.cn',
  ],
  
  // 文件上传限制
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // 请求大小限制
  maxRequestBodySize: 50 * 1024 * 1024, // 50MB
};

// ==========================================
// CSRF 保护
// ==========================================

/**
 * CSRF 令牌生成和验证
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  
  /**
   * 生成CSRF令牌
   */
  static generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < this.TOKEN_LENGTH; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * 验证CSRF令牌（简单的Referer检查）
   */
  static validateRequest(request: NextRequest): boolean {
    // 检查请求来源
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // 如果是同源请求，放行
    if (origin && host && origin.includes(host)) {
      return true;
    }
    
    // 如果没有origin头（如同站POST表单提交），也放行
    if (!origin) {
      return true;
    }
    
    // 允许的来源
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000',
    ];
    
    return allowedOrigins.some(allowed => origin.startsWith(allowed));
  }
}

// ==========================================
// 输入验证
// ==========================================

/**
 * 验证必填字段
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: (keyof T)[] } {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });
  
  return { valid: missing.length === 0, missing };
}

/**
 * 验证ID格式（防止注入）
 */
export function validateId(id: string | undefined): { valid: boolean; error?: string } {
  if (!id) {
    return { valid: false, error: 'ID不能为空' };
  }
  
  // 只允许数字和字母
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { valid: false, error: 'ID格式无效' };
  }
  
  // 长度限制
  if (id.length > 100) {
    return { valid: false, error: 'ID过长' };
  }
  
  return { valid: true };
}

/**
 * 验证数组参数
 */
export function validateArray<T>(
  value: unknown,
  validator?: (item: unknown) => boolean
): { valid: boolean; data?: T[]; error?: string } {
  if (!Array.isArray(value)) {
    return { valid: false, error: '需要是数组类型' };
  }
  
  // 数量限制
  if (value.length > 1000) {
    return { valid: false, error: '数组长度不能超过1000' };
  }
  
  // 如果有验证器
  if (validator) {
    for (const item of value) {
      if (!validator(item)) {
        return { valid: false, error: '数组包含无效元素' };
      }
    }
  }
  
  return { valid: true, data: value as T[] };
}

/**
 * 验证枚举值
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[]
): { valid: boolean; data?: T; error?: string } {
  if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
    return { valid: false, error: `值必须是 ${allowedValues.join(' | ')} 之一` };
  }
  return { valid: true, data: value as T };
}

/**
 * 验证分页参数
 */
export function validatePagination(
  page?: string | null,
  pageSize?: string | null
): { valid: boolean; page?: number; pageSize?: number; error?: string } {
  const p = page ? parseInt(page, 10) : 1;
  const ps = pageSize ? parseInt(pageSize, 10) : 20;
  
  if (isNaN(p) || p < 1) {
    return { valid: false, error: '页码必须是正整数' };
  }
  
  if (isNaN(ps) || ps < 1 || ps > 100) {
    return { valid: false, error: '每页数量必须在1-100之间' };
  }
  
  return { valid: true, page: p, pageSize: ps };
}

// ==========================================
// 文件验证
// ==========================================

/**
 * 验证文件类型
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: readonly string[] = SECURITY_CONFIG.allowedFileTypes
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * 验证文件大小
 */
export function validateFileSize(
  size: number,
  maxSize: number = SECURITY_CONFIG.maxFileSize
): { valid: boolean; error?: string } {
  if (size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `文件大小不能超过${maxMB}MB` };
  }
  return { valid: true };
}

// ==========================================
// URL 安全验证
// ==========================================

/**
 * 验证URL是否在白名单内
 */
export function validateBackendUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // 允许的后端地址
    const allowedOrigins = SECURITY_CONFIG.allowedBackendOrigins.map(o => {
      try {
        return new URL(o).origin;
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    if (!allowedOrigins.includes(parsed.origin)) {
      return { valid: false, error: '请求的URL不在允许范围内' };
    }
    
    // 防止SSRF：禁止内网地址（生产环境）
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname.toLowerCase();
      
      // 阻止内网IP
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        return { valid: false, error: '不允许请求内网地址' };
      }
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: '无效的URL格式' };
  }
}

// ==========================================
// 速率限制（内存版，分布式环境需使用Redis）
// ==========================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;  // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60000, maxRequests: 100 },      // 1分钟100次
  upload: { windowMs: 60000, maxRequests: 20 },       // 1分钟20次上传
  login: { windowMs: 300000, maxRequests: 5 },        // 5分钟5次登录
  password: { windowMs: 3600000, maxRequests: 3 },    // 1小时3次改密
};

/**
 * 检查速率限制
 */
export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS = 'default'
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = RATE_LIMITS[limitType];
  const now = Date.now();
  const key = `${limitType}:${identifier}`;
  
  const record = rateLimitStore.get(key);
  
  // 清理过期记录
  if (record && now > record.resetAt) {
    rateLimitStore.delete(key);
  }
  
  const current = rateLimitStore.get(key);
  
  if (!current) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }
  
  if (current.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  
  current.count++;
  return { allowed: true, remaining: config.maxRequests - current.count, resetAt: current.resetAt };
}

/**
 * 清理过期的速率限制记录
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// 定期清理（每5分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

// ==========================================
// 统一错误处理
// ==========================================

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('[API Error]', error);
  
  if (error instanceof APIError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { success: false, error: '服务器内部错误' },
    { status: 500 }
  );
}

// ==========================================
// 后端请求封装
// ==========================================

/**
 * 创建后端请求选项
 * 用于统一处理后端 API 请求的头信息和认证
 */
export function createBackendRequestOptions(
  request: NextRequest,
  options: RequestInit = {}
): RequestInit {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/session_id=([^;]+)/);
  const sessionId = sessionMatch ? sessionMatch[1] : '';
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }
  
  // 获取当前域名作为 Origin
  const origin = request.headers.get('origin') || 'http://localhost:5000';
  headers['Origin'] = origin;
  
  return {
    ...options,
    headers,
    credentials: 'include',
  };
}

/**
 * 后端请求封装
 * 自动处理认证头和错误响应
 */
export async function backendRequest(
  request: NextRequest,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const backendUrl = getServerBackendUrl();
  const url = `${backendUrl}${path}`;
  const requestOptions = createBackendRequestOptions(request, options);
  
  return fetch(url, requestOptions);
}

/**
 * 后端 JSON 请求封装
 */
export async function backendJsonRequest<T>(
  request: NextRequest,
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await backendRequest(request, path, options);
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.message || data.error || '请求失败' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '网络错误' };
  }
}

// ==========================================
// 日志工具
// ==========================================

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  module: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

/**
 * 安全的日志记录（避免敏感信息泄露）
 */
export function safeLog(entry: Partial<LogEntry>): void {
  const log: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    module: 'api',
    message: '',
    ...entry,
  };
  
  // 过滤敏感字段
  const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'cookie', 'sessionId'];
  const filteredDetails = log.details ? 
    Object.fromEntries(
      Object.entries(log.details).filter(([key]) => 
        !sensitiveFields.some(s => key.toLowerCase().includes(s))
      )
    ) : undefined;
  
  const output = {
    ...log,
    details: filteredDetails,
  };
  
  if (log.level === 'error') {
    console.error(JSON.stringify(output));
  } else if (log.level === 'warn') {
    console.warn(JSON.stringify(output));
  } else {
    console.log(JSON.stringify(output));
  }
}

/**
 * 请求日志中间件
 */
export function logRequest(
  method: string,
  path: string,
  userId?: string,
  details?: Record<string, unknown>
): void {
  safeLog({
    level: 'info',
    module: 'request',
    message: `${method} ${path}`,
    details: {
      ...details,
      userId,
      userAgent: details?.userAgent ? '[REDACTED]' : undefined,
    },
  });
}

// ==========================================
// 后端服务检测
// ==========================================

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
    const apiUrl = getServerBackendUrl();
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

// ==========================================
// FormData 请求封装
// ==========================================

export async function backendFetchFormData(
  request: NextRequest,
  path: string,
  formData: FormData
): Promise<Response> {
  const backendUrl = getServerBackendUrl();
  const url = `${backendUrl}${path}`;
  
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/session_id=([^;]+)/);
  const sessionId = sessionMatch ? sessionMatch[1] : '';
  
  const headers: HeadersInit = {};
  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }
  
  const origin = request.headers.get('origin') || 'http://localhost:5000';
  headers['Origin'] = origin;
  
  return fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });
}

// ==========================================
// API 封装对象（兼容旧代码）
// ==========================================

export const imageApi = {
  async list(params?: Record<string, string | number | boolean>): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    return fetch(`${backendUrl}/images?${searchParams.toString()}`);
  },
  
  async get(id: string): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/images/${id}`);
  },
  
  async upload(formData: FormData): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/images/upload`, {
      method: 'POST',
      body: formData,
    });
  },
  
  async delete(id: string): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/images/${id}`, { method: 'DELETE' });
  },
  
  async batchDelete(ids: string[]): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/images/batch`, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', ids }),
      headers: { 'Content-Type': 'application/json' },
    });
  },
  
  async classify(imageId: string, albumId: string): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/images/classify`, {
      method: 'POST',
      body: JSON.stringify({ imageId, albumId }),
      headers: { 'Content-Type': 'application/json' },
    });
  },
  
  async getTags(): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/images/tags`);
  },
};

export const categoryApi = {
  async list(): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/images/category`);
  },
  
  async get(category: string): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/images/category/${category}`);
  },
};

export const aiApi = {
  async recognize(imageUrl: string): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/ai/recognize`, {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

export const userApi = {
  async getProfile(): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/user/profile`);
  },
  
  async updateProfile(data: Record<string, unknown>): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/user/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  },
  
  async getSettings(): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/user/settings`);
  },
  
  async updateSettings(data: Record<string, unknown>): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/user/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  },
  
  async getNotifications(): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/notifications`);
  },
  
  async markNotificationRead(id: string): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/notifications/${id}/read`, { method: 'POST' });
  },
  
  async markAllNotificationsRead(): Promise<Response> {
    const backendUrl = getServerBackendUrl();
    return fetch(`${backendUrl}/notifications/read-all`, { method: 'POST' });
  },
};
