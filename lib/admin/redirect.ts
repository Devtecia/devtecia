const ADMIN_HOME = '/admin';
const LOGIN_PATH = '/admin/login';
const PROBE_ORIGIN = 'http://admin.invalid';

const isAdminPath = (path: string) => path === ADMIN_HOME || path.startsWith(`${ADMIN_HOME}/`);
const isLoginPath = (path: string) => path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}/`);

/** Returns a same origin `/admin` path to redirect to after sign in, or the fallback. */
export function safeAdminPath(raw: unknown, fallback = ADMIN_HOME): string {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN || !isAdminPath(url.pathname) || isLoginPath(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export { isLoginPath };
