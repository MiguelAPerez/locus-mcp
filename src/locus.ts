export const LOCUS_URL = process.env.LOCUS_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function locus(path: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${LOCUS_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Locus ${res.status}: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
