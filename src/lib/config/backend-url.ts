/**
 * 后端 URL 动态配置模块
 * 支持 ngrok 代理自动检测
 */

// 缓存后端可用性检测结果
let backendAvailableCache: boolean | null = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // 30秒

/**
 * 获取后端 API 基础 URL
 * 优先级：
 * 1. 环境变量 NEXT_PUBLIC_BACKEND_API_URL
 * 2. 当前域名（如果是 ngrok 域名）
 * 3. 默认 localhost:8080
 * 
 * @param requestHost - 可选，从请求头获取的 host（用于 SSR）
 */
export function getBackendApiUrl(requestHost?: string): string {
  // 1. 检查环境变量（优先级最高）
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // 2. SSR 环境：使用传入的 requestHost
  if (requestHost) {
    const isNgrok = requestHost.includes('.ngrok-free.app') || 
                    requestHost.includes('.ngrok.io') || 
                    requestHost.includes('.ngrok.app');
    const isProxy = requestHost !== 'localhost:5000' && 
                    requestHost !== 'localhost:3000' && 
                    !requestHost.startsWith('127.0.0.1');
    
    if (isNgrok || isProxy) {
      return `https://${requestHost}/api`;
    }
  }

  // 3. 浏览器环境下检测 ngrok 域名
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // 检测 ngrok 域名
    if (hostname.includes('.ngrok-free.app') || 
        hostname.includes('.ngrok.io') || 
        hostname.includes('.ngrok.app')) {
      return `${protocol}//${hostname}/api`;
    }
    
    // 检测其他代理域名（如 localtunnel, serveo 等）
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}/api`;
    }
  }

  // 4. 默认本地开发
  return 'http://localhost:8080/api';
}

/**
 * 获取后端静态资源 URL（用于图片等）
 */
export function getBackendStaticUrl(): string {
  const apiUrl = getBackendApiUrl();
  return apiUrl.replace(/\/api$/, '');
}

/**
 * 获取完整的图片 URL
 */
export function getFullImageUrl(url: string | undefined): string {
  if (!url) return '/placeholder.svg';
  
  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }
  
  // 添加后端静态资源 URL
  const staticUrl = getBackendStaticUrl();
  return `${staticUrl}/${url.replace(/^\//, '')}`;
}

/**
 * 用于客户端组件的 hook（响应式获取 URL）
 */
export function useBackendUrl() {
  return {
    apiUrl: getBackendApiUrl(),
    staticUrl: getBackendStaticUrl(),
  };
}
