"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useI18n } from "@/components/LocaleProvider";

export function Header({ user: initialUser = null }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const links = [
    { href: "/", label: t("home") },
    { href: "/auctions", label: t("auctions") },
    { href: "/categories", label: t("categories") },
    { href: "/suppliers", label: t("suppliers") },
    { href: "/sell", label: t("sellLot") },
    { href: "/about", label: t("aboutHouse") },
  ];
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [ready, setReady] = useState(Boolean(initialUser));

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setUser(data.user || null);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function isCurrent(href) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="min-w-0 justify-self-start" aria-label="Bid Ethiopia">
          <BrandMark className="h-11 w-auto max-w-[10.5rem] sm:h-12 sm:max-w-[12rem]" />
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link rounded-xl px-3 py-2"
              aria-current={isCurrent(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-2 text-sm">
          {!ready ? (
            <span className="inline-block h-9 w-16" aria-hidden="true" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden max-w-[7rem] truncate rounded-xl px-3 py-2 text-heading/75 hover:bg-soft sm:inline sm:max-w-28"
              >
                {user.name.split(" ")[0]}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="rounded-xl bg-orange px-3.5 py-2 text-on hover:bg-orange/90">
                  {t("signOut")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-3 py-2 text-heading/75 hover:bg-soft sm:inline"
              >
                {t("signIn")}
              </Link>
              <Link href="/register" className="btn-primary px-4 py-2.5 text-sm">
                {t("join")}
              </Link>
            </>
          )}
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl border border-[color:var(--line)] text-forest lg:hidden"
            aria-expanded={open}
            aria-label={t("toggleMenu")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[color:var(--line)] bg-paper px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1 text-base font-medium text-heading">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 hover:bg-soft"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {ready && user ? (
              <Link href="/dashboard" className="rounded-xl px-3 py-2" onClick={() => setOpen(false)}>
                {t("dashboard")}
              </Link>
            ) : null}
            {ready && !user ? (
              <Link href="/login" className="rounded-xl px-3 py-2" onClick={() => setOpen(false)}>
                {t("signIn")}
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
