// scripts/generate-audio-manifest.mjs
import { promises as fs } from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const audioDir = path.join(publicDir, "audio");

const ALLOWED = new Set(["christmas", "halloween"]);
const EXTS = new Set([".mp3", ".m4a", ".aac", ".ogg", ".wav"]);

function titleFromFile(f) {
  const base = f.replace(/\.[^.]+$/, "");
  return decodeURIComponent(base.replace(/[_-]+/g, " ").trim());
}

async function main() {
  const manifest = { seasons: {} };
  for (const season of await fs.readdir(audioDir)) {
    if (!ALLOWED.has(season)) continue;
    const dir = path.join(audioDir, season);
    const files = (await fs.readdir(dir))
      .filter((f) => EXTS.has(path.extname(f).toLowerCase()))
      .sort();

    manifest.seasons[season] = files.map((f) => ({
      url: `/audio/${season}/${f}`,
      title: titleFromFile(f),
      season,
    }));
  }

  const outPath = path.join(publicDir, "audio-manifest.json");
  await fs.writeFile(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
