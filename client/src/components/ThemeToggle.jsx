import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { applyTheme, getStoredTheme, storeTheme } from "../utils/theme";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function ThemeToggle({ onPersist }) {
  const [theme, setTheme] = useState(() => getStoredTheme());

  // Follow OS changes while in "system" mode
  useEffect(() => {
    if (theme !== "system") return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  const select = (value) => {
    setTheme(value);
    storeTheme(value);
    applyTheme(value);
    onPersist?.(value);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-1 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => select(value)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            theme === value
              ? "bg-[var(--cv-surface-card)] text-[var(--cv-text)] shadow-sm"
              : "text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle;
