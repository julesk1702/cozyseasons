"use client";
export default function SeasonSpinner({
  season = "christmas",
  label = "Loading tracks…",
}) {
  const emoji = season === "halloween" ? "🎃" : "🎅";

  return (
    <div
      className="flex flex-col items-center justify-center py-10 gap-2"
      role="status"
      aria-live="polite"
    >
      <div
        className="spinner-emoji text-5xl sm:text-6xl"
        aria-label={label}
        title={label}
      >
        {emoji}
      </div>
      <div className="text-sm opacity-80">{label}</div>

      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .spinner-emoji {
          animation: bounce 1.2s ease-in-out infinite;
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25));
        }
        @media (prefers-reduced-motion: reduce) {
          .spinner-emoji {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
