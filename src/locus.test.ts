import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// locus() reads LOCUS_URL at call time via the module, so we import after setting env
let locus: (path: string, options?: RequestInit) => Promise<unknown>;
let LOCUS_URL: string;

beforeEach(async () => {
  vi.resetModules();
  process.env.LOCUS_URL = "http://test-host:9000";
  ({ locus, LOCUS_URL } = await import("./locus.js"));
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.LOCUS_URL;
});

function mockFetch(status: number, body: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(body),
    })
  );
}

describe("locus()", () => {
  it("parses a JSON response", async () => {
    mockFetch(200, '{"spaces":[]}');
    const result = await locus("/spaces");
    expect(result).toEqual({ spaces: [] });
  });

  it("returns raw text when response is not valid JSON", async () => {
    mockFetch(200, "ok");
    const result = await locus("/health");
    expect(result).toBe("ok");
  });

  it("throws on non-ok status", async () => {
    mockFetch(404, "not found");
    await expect(locus("/spaces/missing")).rejects.toThrow("Locus 404: not found");
  });

  it("throws on 500 with error body", async () => {
    mockFetch(500, "internal server error");
    await expect(locus("/spaces")).rejects.toThrow("Locus 500: internal server error");
  });

  it("sends correct URL, method, and headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("{}"),
    });
    vi.stubGlobal("fetch", fetchMock);

    await locus("/spaces", { method: "POST", body: JSON.stringify({ name: "test" }) });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://test-host:9000/spaces",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("strips trailing slash from LOCUS_URL", async () => {
    vi.resetModules();
    process.env.LOCUS_URL = "http://test-host:9000/";
    const { locus: locusFresh } = await import("./locus.js");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("{}"),
    });
    vi.stubGlobal("fetch", fetchMock);

    await locusFresh("/health");
    const calledUrl = (fetchMock.mock.calls[0] as [string])[0];
    expect(calledUrl).toBe("http://test-host:9000/health");
  });

  it("defaults to localhost:8000 when LOCUS_URL is unset", async () => {
    vi.resetModules();
    delete process.env.LOCUS_URL;
    const { locus: locusFresh } = await import("./locus.js");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("{}"),
    });
    vi.stubGlobal("fetch", fetchMock);

    await locusFresh("/health");
    const calledUrl = (fetchMock.mock.calls[0] as [string])[0];
    expect(calledUrl).toBe("http://localhost:8000/health");
  });
});
