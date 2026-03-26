import { useTheme } from "../context/ThemeContext";

const ACCENTS = [
  { id: "white",  label: "Default",  color: "#ffffff" },
  { id: "red",    label: "Danger",   color: "#ff3b3b" },
  { id: "blue",   label: "Ocean",    color: "#3b8eff" },
  { id: "purple", label: "Violet",   color: "#a855f7" },
] as const;

export default function ThemePicker() {
  const { accent, setAccent } = useTheme();

  return (
    <div className="flex gap-3">
      {ACCENTS.map((a) => (
        <button
          key={a.id}
          onClick={() => setAccent(a.id)}
          title={a.label}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div
            className="w-8 h-8 rounded-full border-2 transition"
            style={{
              background: a.color,
              borderColor: accent === a.id ? a.color : "#222",
              boxShadow: accent === a.id ? `0 0 0 3px ${a.color}33` : "none",
            }}
          />
          <span className="text-xs text-[#555] group-hover:text-[#888] transition">{a.label}</span>
        </button>
      ))}
    </div>
  );
}
