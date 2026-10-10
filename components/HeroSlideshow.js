"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/LocaleProvider";

const INTERVAL_MS = 4800;

export function HeroSlideshow({ slides }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (!slides.length) {
    return (
      <div className="flex min-h-[22rem] items-center justify-center text-sm text-muted">
        {t("noImage")}
      </div>
    );
  }

  const active = slides[index];
  const go = (delta) => setIndex((current) => (current + delta + slides.length) % slides.length);

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-forest">
          {t("featuredLot")}
        </p>
        <p className="font-mono text-xs tabular-nums text-muted">
          {String(index + 1).padStart(2, "0")}
          <span className="mx-1.5 text-muted/50">/</span>
          {String(slides.length).padStart(2, "0")}
        </p>
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute right-0 top-8 hidden h-[72%] w-[36%] overflow-hidden opacity-40 sm:block"
          aria-hidden="true"
        >
          {slides.length > 1 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slides[(index + 1) % slides.length].image}
              alt=""
              className="h-full w-full scale-110 object-cover"
            />
          ) : null}
        </div>

        <div className="relative z-10 aspect-[5/4] w-[88%] overflow-hidden lg:aspect-[4/5] xl:min-h-[26rem] xl:aspect-auto">
          {slides.map((slide, slideIndex) => (
            <Link
              key={slide.id}
              href={`/auctions/${slide.id}`}
              aria-hidden={slideIndex === index ? undefined : true}
              tabIndex={slideIndex === index ? undefined : -1}
              className={`absolute inset-0 block transition-[opacity,transform] duration-700 ease-out ${
                slideIndex === index
                  ? "scale-100 opacity-100"
                  : "pointer-events-none scale-[1.04] opacity-0"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover"
              />
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 flex w-[88%] items-end justify-between gap-4">
        <Link href={`/auctions/${active.id}`} className="group min-w-0">
          <span className="block truncate text-lg font-semibold tracking-tight text-heading transition group-hover:text-forest sm:text-xl">
            {active.title}
          </span>
          <span className="mt-1 block text-sm font-medium text-forest">{active.price}</span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Previous lot"
            onClick={() => go(-1)}
            className="flex h-9 w-9 items-center justify-center text-lg text-heading/70 transition hover:text-forest"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next lot"
            onClick={() => go(1)}
            className="flex h-9 w-9 items-center justify-center text-lg text-heading/70 transition hover:text-forest"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
