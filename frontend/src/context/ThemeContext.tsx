import { createContext, useContext, useEffect, useState } from "react";

type Accent = "white" | "red" | "blue" | "purple";

interface ThemeCtx {
  accent: Accent;
  setAccent: (a: Accent) => void;
}

const ThemeContext = createContext<ThemeCtx>({ accent: "white", setAccent: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<Accent>(() => {
    return (localStorage.getItem("accent") as Accent) ?? "white";
  });

  const setAccent = (a: Accent) => {
    setAccentState(a);
    localStorage.setItem("accent", a);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  return (
    <ThemeContext.Provider value={{ accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
