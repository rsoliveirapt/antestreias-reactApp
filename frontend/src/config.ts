export const API_BASE = 'http://localhost/antestreias/v2/backend';

/** Inline SVG placeholder for missing images — no external dependency */
export const PLACEHOLDER_IMG = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" fill="#181818"><rect width="300" height="450"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#444" font-family="sans-serif" font-size="14">Sem imagem</text></svg>')}`;

/**
 * Wrapper around fetch that automatically includes credentials for session-based auth.
 * Use this for all API calls that require authentication (admin endpoints, user actions, etc.)
 */
export function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
}
