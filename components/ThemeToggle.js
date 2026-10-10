"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/LocaleProvider";

export function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("auction-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? t("switchToLight") : t("switchToDark")}
      className="grid h-11 w-11 place-items-center rounded-xl border border-[color:var(--line)] text-lg text-heading hover:bg-soft"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
