import { NextResponse } from "next/server";

const API_BASE = "https://api.abacatepay.com";

export async function GET() {
  const rawToken = process.env.ABACATEPAY_TOKEN ?? process.env.ABACATEPAY_API_KEY ?? "";
  const headerValue = rawToken.trim().toLowerCase().startsWith("bearer ")
    ? rawToken.trim()
    : rawToken
    ? `Bearer ${rawToken.trim()}`
    : "";

  try {
    const res = await fetch(`${API_BASE}/v1/store/get`, {
      method: "GET",
      headers: headerValue ? { Authorization: headerValue, accept: "application/json" } : { accept: "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    const body: unknown = (() => {
      try { return JSON.parse(text) as unknown; } catch { return text; }
    })();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      headerPreview: headerValue ? `${headerValue.slice(0, 12)}…` : "<empty>",
      body,
    }, { status: res.ok ? 200 : 200 });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: String(e),
      headerPreview: headerValue ? `${headerValue.slice(0, 12)}…` : "<empty>",
    }, { status: 200 });
  }
}
