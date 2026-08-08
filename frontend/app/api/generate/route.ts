import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const body = await request.json();

  let response: Response;
  try {
    response = await fetch(`${backendUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300_000), // 5 minutos
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ detail: `Error de conexión: ${msg} | URL: ${backendUrl}` }, { status: 502 });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return NextResponse.json(error, { status: response.status });
  }

  const buffer = await response.arrayBuffer();
  const disposition = response.headers.get("Content-Disposition") ?? 'attachment; filename="audio.wav"';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Content-Disposition": disposition,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
