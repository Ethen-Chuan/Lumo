import type { AppLanguage, ThemeMode } from "../store/useAppStore";

// themeOptions ids in order — mirrors the App.tsx constant, kept here to avoid
// importing the full lucide icon set into a pure utility module.
const THEME_ORDER: ThemeMode[] = ["light", "dark", "warm", "mint"];

export function nextThemeMode(themeMode: ThemeMode): ThemeMode {
  const index = THEME_ORDER.indexOf(themeMode);
  return THEME_ORDER[(index + 1) % THEME_ORDER.length];
}

export function navItemLabel(
  item: { label: string; labelEn: string },
  language: AppLanguage
): string {
  return language === "en" ? item.labelEn : item.label;
}

export function isEn(language: AppLanguage): boolean {
  return language === "en";
}

export function safeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 72) || "lumo-export";
}

export function initials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "LU";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return Array.from(cleaned).slice(0, 2).join("").toUpperCase();
}

export function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function weekdayLabel(date: Date): string {
  return ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][date.getDay()];
}
