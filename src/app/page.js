"use client";
import { useMemo, useState, useEffect } from "react";
import TrackList from "./components/TrackList.js";
import BackgroundAudio from "./components/BackgroundAudio";
import SeasonalBackdrop from "./components/SeasonalBackdrop";
import { SeasonProvider, useSeason } from "./libs/useSeason.js";
import Counter from "./components/Counter/Counter.jsx";

function SeasonSwitcher() {
  const { season, setSeason } = useSeason();
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full bg-white/10 hover:bg-white/15 transition border border-white/20"
        title="Change season"
      >
        <span aria-hidden>{season === "halloween" ? "🎃" : "❄️"}</span>
      </button>

      {open && (
        <div className="mt-2 w-40 rounded-xl border border-white/15 bg-white/10 backdrop-blur p-2">
          <button
            onClick={() => {
              setSeason("christmas");
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 ${
              season === "christmas" ? "bg-white/10" : ""
            }`}
          >
            ❄️ Christmas
          </button>
          <button
            onClick={() => {
              setSeason("halloween");
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 ${
              season === "halloween" ? "bg-white/10" : ""
            }`}
          >
            🎃 Halloween
          </button>
        </div>
      )}
    </div>
  );
}

function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const now = new Date();
    const diff = targetDate - now;
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / (1000 * 60 * 60 * 24)),
      h: Math.floor((diff / (1000 * 60 * 60)) % 24),
      m: Math.floor((diff / (1000 * 60)) % 60),
      s: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  console.log(timeLeft.d);

  return (
    <>
      <div>
        <Counter
          value={timeLeft.d}
          places={[10, 1]}
          fontSize={64}
          padding={5}
          gap={4}
          textColor="white"
          fontWeight={900}
        />
        <span
          style={{
            fontSize: "64px",
            fontWeight: "900",
            color: "white",
            display: "inline-block",
            verticalAlign: "top",
          }}
        >
          :
        </span>
        <Counter
          value={timeLeft.h}
          places={[10, 1]}
          fontSize={64}
          padding={5}
          gap={4}
          textColor="white"
          fontWeight={900}
        />
        <span
          style={{
            fontSize: "64px",
            fontWeight: "900",
            color: "white",
            display: "inline-block",
            verticalAlign: "top",
          }}
        >
          :
        </span>
        <Counter
          value={timeLeft.m}
          places={[10, 1]}
          fontSize={64}
          padding={5}
          gap={4}
          textColor="white"
          fontWeight={900}
        />
        <span
          style={{
            fontSize: "64px",
            fontWeight: "900",
            color: "white",
            display: "inline-block",
            verticalAlign: "top",
          }}
        >
          :
        </span>
        <Counter
          value={timeLeft.s}
          places={[10, 1]}
          fontSize={64}
          padding={5}
          gap={4}
          textColor="white"
          fontWeight={900}
        />
      </div>
    </>
  );
}

function PageInner() {
  const [flakes] = useState(150);
  const { season } = useSeason();
  const [loading, setLoading] = useState(true);

  const [target, setTarget] = useState(() => {
    return season === "halloween"
      ? new Date(`${new Date().getFullYear()}-10-31T00:00:00`)
      : new Date(`${new Date().getFullYear()}-12-25T00:00:00`);
  });

  if (season) {
    const newTarget =
      season === "halloween"
        ? new Date(`${new Date().getFullYear()}-10-31T00:00:00`)
        : new Date(`${new Date().getFullYear()}-12-25T00:00:00`);
    if (newTarget.getTime() !== target.getTime()) {
      setTarget(newTarget);
    }
  }

  const snow = useMemo(() => {
    const items = [];
    const count = Math.max(0, Math.min(300, flakes));
    for (let i = 0; i < count; i++) {
      const left = Math.random() * 100;
      const size = Math.random() * 6 + 3;
      const fall = Math.random() * 8 + 10;
      const delay = Math.random() * 12;
      const sway = Math.random() * 24 + 8 + "px";
      const swaydur = Math.random() * 4 + 5 + "s";
      const sx = Math.random() * 10 - 5 + "px";
      items.push(
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${left}vw`,
            ["--size"]: `${size}px`,
            ["--fall"]: `${fall}s`,
            ["--delay"]: `${delay}s`,
            ["--sway"]: sway,
            ["--swaydur"]: swaydur,
            ["--sx"]: sx,
          }}
        />
      );
    }
    return items;
  }, [flakes]);

  return (
    <>
      {/* Seasonal visuals */}
      <SeasonalBackdrop flakes={flakes} />

      <SeasonSwitcher />

      {/* Hero */}
      <section
        aria-labelledby="hero-title"
        className="section relative z-10 flex flex-col items-center justify-center px-4 text-center"
      >
        <div className="max-w-2xl">
          <h1
            id="hero-title"
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6"
          >
            <Countdown key={target} targetDate={target} />
          </h1>
          <p className="max-w-xl text-lg sm:text-xl opacity-90 mx-auto">
            {season === "halloween"
              ? "Counting down to Halloween with spooky tunes."
              : "Counting down to Christmas with cozy vibes."}
          </p>
          <div className="mt-10">
            <a
              href="#tracks"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 backdrop-blur px-5 py-3 text-sm font-medium transition"
            >
              See all {season === "halloween" ? "spooky" : "holiday"} tracks
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14M12 19l-6-6M12 19l6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <TrackList key={season} season={season} setLoading={setLoading} />

      <BackgroundAudio />
    </>
  );
}

export default function Page() {
  return (
    <SeasonProvider>
      <PageInner />
    </SeasonProvider>
  );
}
