"use client";
import { useMemo } from "react";
import { useSeason } from "../libs/useSeason.js";

function SnowLayer({ count = 150 }) {
  const items = useMemo(() => {
    const arr = [];
    const n = Math.max(0, Math.min(300, count));
    for (let i = 0; i < n; i++) {
      const left = Math.random() * 100;
      const size = Math.random() * 6 + 3; // px
      const fall = Math.random() * 8 + 10; // s
      const delay = Math.random() * 12; // s
      const sway = Math.random() * 24 + 8 + "px";
      const swaydur = Math.random() * 4 + 5 + "s";
      const sx = Math.random() * 10 - 5 + "px";
      arr.push(
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
    return arr;
  }, [count]);
  return <div className="snow-layer">{items}</div>;
}

function PumpkinLayer({ count = 50 }) {
  const items = useMemo(() => {
    const arr = [];
    const n = Math.max(0, Math.min(120, count));
    for (let i = 0; i < n; i++) {
      const left = Math.random() * 100;
      const size = Math.random() * 6 + 3; // px
      const fall = Math.random() * 8 + 10; // s
      const delay = Math.random() * 12; // s
      const sway = Math.random() * 24 + 8 + "px";
      const swaydur = Math.random() * 4 + 5 + "s";
      const sx = Math.random() * 10 - 5 + "px";
      arr.push(
        <div
          key={i}
          className="pumpkin"
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
    return arr;
  }, [count]);

  return <div className="pumpkin-layer">{items}</div>;
}

export default function SeasonalBackdrop({ flakes = 150 }) {
  const { season } = useSeason();
  return season === "halloween" ? (
    <PumpkinLayer count={48} />
  ) : (
    <SnowLayer count={flakes} />
  );
}
