const STORAGE_KEY = "agora.session";
const COOKIE = "agora_session";

export function writeBrowserSession(cadeado: string): void {
  const value = cadeado.trim();
  if (!value) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* private mode can block storage */
  }
  document.cookie = `${COOKIE}=${encodeURIComponent(value)}; Path=/; SameSite=Strict`;
}

export function readBrowserSession(): string | null {
  try {
    const fromTab = sessionStorage.getItem(STORAGE_KEY);
    if (fromTab) return fromTab;
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearBrowserSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = `${COOKIE}=; Path=/; Max-Age=0; SameSite=Strict`;
}
