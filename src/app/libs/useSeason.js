import { useEffect, useState, createContext, useContext } from "react";

const SeasonContext = createContext({
  season: "christmas",
  setSeason: () => {},
});

export function SeasonProvider({ children }) {
  const [season, setSeason] = useState(() => {
    if (typeof window === "undefined") return "christmas";
    return localStorage.getItem("season") || "christmas";
  });

  // persist & update body data-theme for CSS
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("season", season);
      document.body.dataset.theme = season; // used by CSS themes
    }
  }, [season]);

  return (
    <SeasonContext.Provider value={{ season, setSeason }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  return useContext(SeasonContext);
}
