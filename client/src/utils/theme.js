/**
 * Theme utility — manages light/dark/system theme.
 * Theme is persisted to localStorage and applied via a CSS class on <html>.
 */

const STORAGE_KEY = "cv-theme";

export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "system";
  } catch {
    return "system";
  }
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // system
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}
