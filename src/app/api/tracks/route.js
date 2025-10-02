import { NextResponse } from "next/server";

export const runtime = "edge"; // no Node fs, tiny & fast
const ALLOWED = new Set(["christmas", "halloween"]);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("season") || "christmas").toLowerCase();
  const season = ALLOWED.has(raw) ? raw : "christmas";

  // Read the prebuilt manifest from /public (static)
  const manifestUrl = new URL("/audio-manifest.json", req.url);
  const res = await fetch(manifestUrl.toString(), { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json(
      { tracks: [], error: "Manifest not found" },
      { status: 500 }
    );
  }

  const manifest = await res.json();
  const tracks = manifest?.seasons?.[season] ?? [];
  return NextResponse.json(
    { season, tracks },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
