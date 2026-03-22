export const LOCUS_URL = process.env.LOCUS_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function locus(path: string, options: RequestInit = {}): Promise<unknown> {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...options.headers as Record<string, string> }
    : { "Content-Type": "application/json", ...options.headers as Record<string, string> };

  let url = `${LOCUS_URL}${path}`;
  let res = await fetch(url, { ...options, headers, redirect: "manual" });

  // Follow redirects manually to preserve method (fetch changes POST→GET on 301/302)
  while (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) break;
    url = location.startsWith("http") ? location : `${LOCUS_URL}${location}`;
    res = await fetch(url, { ...options, headers, redirect: "manual" });
  }
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
