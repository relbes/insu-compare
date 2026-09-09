// Global Fetch Interceptor and authFetch utility
// Automatically attaches JWT authorization headers and handles session expiration across the entire system.

// Safely reference the original native fetch once at initialization
const nativeFetch: typeof fetch = 
  typeof window !== 'undefined' && typeof window.fetch === 'function'
    ? window.fetch.bind(window)
    : fetch;

/**
 * Resolves an API URL dynamically according to the deployment path.
 * E.g., if hosted at https://aoujo.online/insurance/, /api/health -> /insurance/api/health.
 * If hosted at root / or local dev, /api/health -> /api/health.
 */
export function resolveApiUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  if (!url.startsWith('/api/')) return url;

  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  // If first segment is not 'api' (e.g., 'insurance'), prefix it
  if (segments.length > 0 && segments[0] !== 'api') {
    const subpath = `/${segments[0]}`;
    if (!url.startsWith(subpath)) {
      return `${subpath}${url}`;
    }
  }
  return url;
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof (input as Request).url === 'string') {
    url = (input as Request).url;
  }

  // Automatically adapt relative API path if deployed under a subfolder (e.g. /insurance)
  const resolvedUrl = resolveApiUrl(url);
  const finalInput: RequestInfo | URL = (typeof input === 'string') ? resolvedUrl : input;

  const updatedInit: RequestInit = { ...(init || {}) };

  // Only intercept internal /api/ calls
  if (resolvedUrl.startsWith('/api/') || resolvedUrl.includes('/api/')) {
    const isPublicPath = 
      resolvedUrl.includes('/api/auth/login') ||
      resolvedUrl.includes('/api/health') ||
      resolvedUrl.includes('/api/auth/public-info');

    if (!isPublicPath) {
      let token: string | null = null;
      try {
        token = localStorage.getItem('insur_auth_token');
      } catch {}

      if (token) {
        const headers = new Headers(updatedInit.headers || {});
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        updatedInit.headers = headers;
      }
    }
  }

  try {
    // ALWAYS call the unmutated native fetch to prevent recursive call stack loops
    const response = await nativeFetch(finalInput, updatedInit);

    // If token expired or unauthorized on protected routes, trigger logout event
    if (response.status === 401 && !resolvedUrl.includes('/api/auth/login')) {
      try {
        localStorage.removeItem('insur_auth_token');
        localStorage.removeItem('insur_auth_user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('insur_auth_unauthorized'));
        }
      } catch {}
    }

    return response;
  } catch (error) {
    throw error;
  }
}

let isInterceptorInitialized = false;

export function initAuthInterceptor() {
  if (isInterceptorInitialized) return;
  isInterceptorInitialized = true;
  // Note: We deliberately do NOT overwrite window.fetch to avoid recursion and accessor property issues.
  // All internal API calls across the app use authFetch directly.
}
