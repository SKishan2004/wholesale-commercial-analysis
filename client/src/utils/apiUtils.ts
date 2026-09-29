/**
 * Safely parse JSON from a fetch Response.
 * Prevents "Unexpected end of JSON input" errors if the server returns an empty body,
 * non-JSON error page, or connection reset.
 */
export async function safeParseJson<T = any>(response: Response, fallback: any = {}): Promise<T> {
  try {
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return fallback as T;
    }
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn('Failed to parse JSON response:', err);
    return fallback as T;
  }
}
