import { useEffect, useState } from "react";
import shuffle from "../libs/shuffle.js";
import formatTime from "../libs/formatTime.js";
import TextType from "./TextType/TextType.jsx";

const seasonalFacts = {
halloween: [
  "Pumpkins are technically a fruit, not a vegetable!",
  "Bats are a symbol of Halloween because they often appeared at bonfires.",
  "Americans buy around 600 million pounds of candy for Halloween each year.",
  "The tradition of costumes comes from trying to scare away spirits.",
  "The first jack-o'-lanterns were made from turnips, not pumpkins.",
  "Ireland is considered the birthplace of modern Halloween traditions.",
  "Trick-or-treating may have roots in the medieval practice of 'souling.'",
  "Black cats are a Halloween symbol because they were once thought to be witches' familiars.",
  "Candy corn was invented in the 1880s and was originally called 'chicken feed.'",
  "Some people used to carve faces into beets and potatoes before pumpkins became popular.",
  "Owls were once believed to be witches in disguise on Halloween night.",
  "The world's largest pumpkin ever recorded weighed over 2,700 pounds.",
  "In Mexico, Día de los Muertos (Day of the Dead) happens at the same time as Halloween.",
  "The colors orange and black symbolize harvest (orange) and darkness/death (black).",
  "Harry Houdini died on Halloween night in 1926.",
  "The word 'witch' comes from the Old English word 'wicce,' meaning 'wise woman.'",
  "Haunted house attractions became popular in the U.S. during the Great Depression.",
  "The fear of Halloween is called 'samhainophobia.'",
  "Jack-o'-lanterns were originally meant to ward off evil spirits.",
  "New York City's Village Halloween Parade is the largest in the U.S., attracting over 2 million people."
],

christmas: [
  "Santa Claus is based on Saint Nicholas, a 4th-century bishop.",
  "The first artificial Christmas trees were made of goose feathers dyed green.",
  "'Jingle Bells' was originally written for Thanksgiving, not Christmas!",
  "Exchanging gifts was popularized in the Victorian era.",
  "The tradition of Christmas stockings comes from a legend of Saint Nicholas dropping coins down a chimney.",
  "Rudolph was created in 1939 as a promotional character for a department store.",
  "The first Christmas card was sent in 1843 in England.",
  "In Japan, eating KFC for Christmas is a popular tradition.",
  "The world's tallest cut Christmas tree was over 220 feet tall.",
  "Tinsel was originally made from real silver strands.",
  "The song 'Silent Night' was first performed with a guitar because the church organ broke.",
  "The tradition of decorating trees comes from Germany in the 16th century.",
  "The modern image of Santa in a red suit was popularized by Coca-Cola ads in the 1930s.",
  "Christmas was banned in England from 1647 to 1660 by Puritans.",
  "Norway sends a Christmas tree to London every year as thanks for World War II support.",
  "Iceland has 13 Santa-like figures called 'Yule Lads.'",
  "In some parts of the world, spiders and webs are considered lucky Christmas decorations.",
  "The first U.S. president to decorate a White House Christmas tree was Franklin Pierce.",
  "The word 'Xmas' comes from the Greek letter Chi, which looks like an X and stands for Christ.",
  "Christmas lights were invented by Thomas Edison's assistant in 1882."
]

};

export default function TrackList({ season, setLoading }) {
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState("");

  // Fetch tracks
  useEffect(() => {
    let cancelled = false;
    setTracks([]);
    setError("");
    setLoading?.(true);

    (async () => {
      try {
        const baseRes = await fetch(`/api/tracks?season=${season}`, {
          cache: "no-store",
        });
        if (cancelled) return;
        const base = await baseRes.json();
        if (!Array.isArray(base?.tracks))
          throw new Error(base?.error || "Failed to load tracks");

        // Enrich with Spotify
        const enrichRes = await fetch("/api/spotify/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracks: base.tracks }),
        });

        const enriched = await enrichRes.json();
        if (cancelled) return;

        if (!enrichRes.ok) {
          setTracks(shuffle(base.tracks));
          setError(`Enrichment failed: ${enriched?.error || enrichRes.status}`);
          setLoading?.(false);
          return;
        }

        setTracks(shuffle(enriched.tracks || base.tracks));
        setError("");
        setLoading?.(false);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Failed to load tracks");
        setLoading?.(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [season]);
  
  // shuffle facts to show different ones each time
  const facts = shuffle(seasonalFacts[season] || []).slice(0, 5);
  const [firstFact, ...otherFacts] = facts;

  if (error) {
    return (
      <section className="section relative z-10 flex items-center justify-center px-4 pt-20">
        <div className="text-sm text-red-400">Error: {error}</div>
      </section>
    );
  }

  if (!tracks.length) {
    return (
      <section id="tracks" className="section relative z-10 flex flex-col items-center justify-center px-4 text-center">
        <div
          className="max-w-xl"
          style={{ fontSize: "1rem", fontWeight: "900" }}
        >
          <TextType
            text={facts}
            pauseDuration={2000}
            showCursor={true}
            cursorCharacter="|"
            variableSpeed={{ min: 20, max: 60 }}
          />
        </div>
        <div className="text-sm text-gray-400 mt-4">Loading tracks…</div>
      </section>
    );
  }

  return (
    <section
      id="tracks"
      aria-labelledby="tracks-title"
      className="section relative z-10 flex items-start justify-center px-4 pt-20"
    >
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6">
        <h2 id="tracks-title" className="text-2xl font-semibold mb-4">
          All Tracks
        </h2>
        <p className="mb-4 text-sm opacity-80">
          Curated background music for the season.
        </p>
        <div className="max-h-[60svh] overflow-y-auto">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tracks.map((t, i) => (
              <li
                key={i}
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3"
              >
                {/* Cover */}
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-white/10 shrink-0">
                  {t.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs opacity-60">
                      No art
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {t.title || "Untitled"}
                  </div>
                  <div className="text-xs opacity-80 truncate">
                    {t.artist
                      ? `${t.artist} • ${t.album || ""}`
                      : t.album || ""}
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-xs">
                    {t.duration_ms ? (
                      <span className="opacity-70">
                        {formatTime(Math.round(t.duration_ms / 1000))}
                      </span>
                    ) : null}

                    {t.spotify_url ? (
                      <a
                        href={t.spotify_url}
                        target="_blank"
                        rel="noreferrer"
                        className="opacity-90 hover:underline"
                      >
                        Open in Spotify
                      </a>
                    ) : null}

                    {t.preview_url ? (
                      <audio
                        src={t.preview_url}
                        controls
                        className="ml-auto h-6"
                      />
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
