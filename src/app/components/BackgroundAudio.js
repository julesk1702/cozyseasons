"use client";
import { useEffect, useRef, useState } from "react";
import formatTime from "../libs/formatTime.js";
import shuffle from "../libs/shuffle.js";
import { useSeason } from "../libs/useSeason.js";

export default function BackgroundAudio() {
  const { season } = useSeason();
  const audioRef = useRef(null);

  const [playing, setPlaying] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("xmas_volume");
      return v ? Number(v) : 0.12;
    }
    return 0.12;
  });

  const [tracks, setTracks] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);

  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);

  // Slide/collapse (peek) state
  const [collapsed, setCollapsed] = useState(false);
  const inactivityTimerRef = useRef(null);

  const clearInactivity = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };
  const scheduleCollapse = (ms = 3500) => {
    clearInactivity();
    inactivityTimerRef.current = setTimeout(() => setCollapsed(true), ms);
  };
  const bumpActivity = () => {
    setCollapsed(false);
    scheduleCollapse();
  };

  useEffect(() => {
    scheduleCollapse();
    return () => clearInactivity();
  }, []);

  // Fetch tracks whenever season changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTracks([]);
      setQueue([]);
      setCurrentIdx(-1);
      setTime(0);
      setDuration(0);
      try {
        const res = await fetch(`/api/tracks?season=${season}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        const list = Array.isArray(data.tracks) ? data.tracks : [];
        setTracks(list);
        if (list.length) {
          const idxs = shuffle(list.map((_, i) => i));
          setQueue(idxs.slice(1));
          setCurrentIdx(idxs[0]);
        }
      } catch {
        if (!cancelled) setTracks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [season]);

  // Persist volume
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("xmas_volume", String(volume));
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Autoplay after first gesture
  useEffect(() => {
    const tryPlay = () => {
      if (!audioRef.current) return;
      audioRef.current.volume = volume;
      audioRef.current
        .play()
        .then(() => {
          setPlaying(true);
          setBlocked(false);
          bumpActivity();
        })
        .catch(() => setBlocked(true));
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
    };
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("keydown", tryPlay);
    window.addEventListener("touchstart", tryPlay);
    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
    };
  }, [volume, season]);

  // MediaSession
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const t = tracks[currentIdx];
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title:
          t?.title ||
          (season === "halloween" ? "Spooky Mix" : "Merry Christmas"),
        artist: season === "halloween" ? "Autumn Vibes" : "Holiday Mix",
        album: season === "halloween" ? "Halloween" : "Ambient Xmas",
      });
      navigator.mediaSession.setActionHandler("seekto", (e) => {
        if (!audioRef.current || !isFinite(e.seekTime)) return;
        audioRef.current.currentTime = e.seekTime;
        setTime(e.seekTime);
        bumpActivity();
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.min(
          duration,
          audioRef.current.currentTime + 10
        );
        bumpActivity();
      });
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.max(
          0,
          audioRef.current.currentTime - 10
        );
        bumpActivity();
      });
    } catch {}
  }, [currentIdx, tracks, duration, season]);

  // Next track (shuffle queue)
  const nextTrack = () => {
    if (!tracks.length) return;
    setTime(0);
    setDuration(0);
    if (queue.length === 0) {
      const all = tracks.map((_, i) => i);
      const fresh = shuffle(all);
      if (fresh[0] === currentIdx && fresh.length > 1)
        [fresh[0], fresh[1]] = [fresh[1], fresh[0]];
      setCurrentIdx(fresh[0]);
      setQueue(fresh.slice(1));
      return;
    }
    const [head, ...rest] = queue;
    setCurrentIdx(head);
    setQueue(rest);
  };

  const currentSrc = currentIdx >= 0 ? tracks[currentIdx]?.url : undefined;
  const currentTitle = currentIdx >= 0 ? tracks[currentIdx]?.title : "";

  // Seek handlers
  const onSeekStart = () => {
    setSeeking(true);
    bumpActivity();
  };
  const onSeekChange = (e) => setTime(Number(e.target.value));
  const onSeekEnd = (e) => {
    const val = Number(e.target.value);
    setSeeking(false);
    if (audioRef.current) audioRef.current.currentTime = val;
    bumpActivity();
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSrc}
        preload="auto"
        onEnded={nextTrack}
        onError={nextTrack}
        autoPlay
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : 0);
          setTime(0);
        }}
        onTimeUpdate={(e) => {
          if (!seeking) setTime(e.currentTarget.currentTime || 0);
        }}
      />

      {/* Mini player shell */}
      <div
        className="player-shell"
        style={{
          ["--peek"]: "56px",
          position: "fixed",
          bottom: "calc(env(safe-area-inset-bottom) + 1rem)",
          right: "calc(env(safe-area-inset-right) + 1rem)",
          zIndex: 50,
        }}
        onMouseEnter={() => {
          setCollapsed(false);
          clearInactivity();
        }}
        onMouseLeave={() => {
          scheduleCollapse(2000);
        }}
        onFocus={() => {
          setCollapsed(false);
          clearInactivity();
        }}
        onBlur={() => {
          scheduleCollapse(2000);
        }}
        onTouchStart={() => {
          setCollapsed(false);
          clearInactivity();
        }}
      >
        <div
          className="player-panel"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.65rem",
            borderRadius: "1rem",
            backdropFilter: "blur(8px)",
            boxShadow: "0 10px 24px rgba(0,0,0,.25)",
            border: "1px solid",
            borderColor:
              "color-mix(in oklab, var(--foreground) 15%, transparent)",
            background:
              "color-mix(in oklab, var(--foreground) 8%, transparent)",
            transform: collapsed
              ? "translateX(calc(100% - var(--peek)))"
              : "translateX(0)",
            transition: "transform .35s ease",
            willChange: "transform",
            maxWidth: "92vw", // never exceed viewport
          }}
        >
          {/* Play / Pause — first so it stays visible when collapsed */}
          <button
            onClick={() => {
              if (!audioRef.current) return;
              if (playing) {
                audioRef.current.pause();
                setPlaying(false);
              } else {
                audioRef.current
                  .play()
                  .then(() => {
                    setPlaying(true);
                    setBlocked(false);
                  })
                  .catch(() => setBlocked(true));
              }
              bumpActivity();
            }}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border hover:opacity-90 transition shrink-0"
            style={{
              borderColor:
                "color-mix(in oklab, var(--foreground) 20%, transparent)",
            }}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            )}
          </button>

          {/* Progress — responsive width */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hide time stamps on tiny screens */}
            <span className="time-start text-[10px] opacity-75 tabular-nums w-8 text-right hidden xs:inline-block">
              {formatTime(time)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={Math.min(time, duration || 0)}
              onMouseDown={onSeekStart}
              onTouchStart={onSeekStart}
              onChange={onSeekChange}
              onMouseUp={onSeekEnd}
              onTouchEnd={onSeekEnd}
              className="progress flex-1 w-[46vw] sm:w-56"
              title="Seek"
              disabled={!duration}
              style={{ accentColor: "var(--accent)" }}
            />
            <span className="time-end text-[10px] opacity-75 tabular-nums w-8 hidden xs:inline-block">
              {formatTime(duration)}
            </span>
          </div>

          {/* Now playing — truncate and shrink on small screens */}
          <div
            className="np text-xs opacity-80 truncate"
            style={{
              maxWidth: "32vw", // small phones
            }}
          >
            <span className="hidden sm:inline">
              {currentTitle || "Loading tracks…"}
            </span>
            <span className="sm:hidden">
              {(currentTitle || "Loading…").slice(0, 18)}
              {(currentTitle || "").length > 18 ? "…" : ""}
            </span>
          </div>

          {blocked && (
            <span className="text-[10px] opacity-75 shrink-0">Tap play</span>
          )}
        </div>
      </div>
    </>
  );
}
