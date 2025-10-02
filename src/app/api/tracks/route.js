import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const ALLOWED = new Set(["christmas", "halloween"]);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season")?.toLowerCase() || "christmas";
    const safeSeason = ALLOWED.has(season) ? season : "christmas";

    const dir = path.join(process.cwd(), "public", "audio", safeSeason);
    const names = await fs.readdir(dir);

    const exts = new Set([".mp3", ".m4a", ".aac", ".ogg", ".wav"]);
    const files = names
      .filter((n) => exts.has(path.extname(n).toLowerCase()))
      .sort();

    const tracks = files.map((f) => {
      const url = `/audio/${safeSeason}/${f}`;
      const base = f.replace(/\.[^.]+$/, "");
      const title = decodeURIComponent(base.replace(/[_-]+/g, " ").trim());
      return { url, title, season: safeSeason };
    });

    return NextResponse.json(
      { season: safeSeason, tracks },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e) {
    return NextResponse.json({ tracks: [], error: e.message }, { status: 500 });
  }
}
