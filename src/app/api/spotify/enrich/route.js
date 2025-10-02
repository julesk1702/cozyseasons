// app/api/spotify/enrich/route.js
import { NextResponse } from "next/server";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const SEARCH_URL = "https://api.spotify.com/v1/search";

// tiny in-memory token cache to avoid requesting a token for every call
let _token = null;
let _tokenExpiresAt = 0;

async function getToken() {
  const now = Date.now();
  if (_token && now < _tokenExpiresAt - 10_000) {
    return _token;
  }

  const id = "793727a29b85463094b023d7ce68ed87";
  const secret = "c3e7d269c58b4fe39b4e50be5aa23a19";
  if (!id || !secret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Spotify token failed: ${res.status} ${txt}`);
  }

  const data = await res.json();
  _token = data.access_token;
  _tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return _token;
}

function buildQuery(title, artist) {
  // REQUIRED: title
  let q = title ? String(title).trim() : "";
  // OPTIONAL: narrow by artist if you have it
  if (artist && artist.trim()) {
    q += ` artist:${artist.trim()}`;
  }
  return q;
}

function pickFirstItem(data) {
  // Normal Spotify Search: { tracks: { items: [...] } }
  if (data && data.tracks && Array.isArray(data.tracks.items) && data.tracks.items.length) {
    return data.tracks.items[0];
  }
  // Your sample shape: { items: [...] }
  if (data && Array.isArray(data.items) && data.items.length) {
    return data.items[0];
  }
  return null;
}

function mapItemToTrack(base, item) {
  if (!item) return { ...base, spotify: null };

  const artists = Array.isArray(item.artists)
    ? item.artists.map((a) => a?.name).filter(Boolean).join(", ")
    : base.artist || "";

  const album = item.album?.name || "";
  const image =
    (item.album?.images && item.album.images[0]?.url) ||
    "";
  const preview_url = item.preview_url || "";
  const spotify_url = item.external_urls?.spotify || "";
  const duration_ms = item.duration_ms || 0;
  const popularity = item.popularity ?? null;
  const release_date = item.album?.release_date || "";

  return {
    ...base,
    artist: artists || base.artist || "",
    album,
    image,
    preview_url,
    spotify_url,
    duration_ms,
    popularity,
    release_date,
    spotify_track_id: item.id || "",
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const input = Array.isArray(body?.tracks) ? body.tracks : [];
    if (!input.length) return NextResponse.json({ tracks: [] });

    const accessToken = await getToken();

    // Query Spotify sequentially (simple & avoids hitting rate limits fast)
    const out = [];
    for (const t of input) {
      const title = t?.title || "";
      const artist = t?.artist || "";
      if (!title.trim()) {
        out.push({ ...t, spotify: null });
        continue;
      }

      const q = buildQuery(title, artist);
      const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&type=track&limit=1&include_external=audio`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      if (!res.ok) {
        // Keep base data even if enrichment fails
        out.push({ ...t, spotify: null, _error: `search ${res.status}` });
        continue;
      }

      const data = await res.json();
      const item = pickFirstItem(data);
      out.push(mapItemToTrack(t, item));
    }

    return NextResponse.json({ tracks: out });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to enrich tracks" },
      { status: 500 }
    );
  }
}
