import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { ListingCard } from "@/components/ListingCard";
import { formatDate, formatETB, parseImages } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import {
  getEndingSoonListings,
  getFeaturedListings,
  getScheduledListings,
} from "@/lib/listings";
import { categoryName, cityName, translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  const [featured, endingSoon, scheduled] = await Promise.all([
    getFeaturedListings(),
    getEndingSoonListings(),
    getScheduledListings(),
  ]);
  const slides = featured.flatMap((listing) => {
    const image = parseImages(listing.images)[0];
    if (!image) return [];
    return [
      {
        id: listing.id,
        title: listing.title,
        price: formatETB(listing.currentBid, locale),
        image,
      },
    ];
  });

  return (
    <div className="pb-10">
      <section className="hero-plane relative overflow-hidden">
        <div className="hero-blob hero-blob-a" aria-hidden="true" />
        <div className="hero-blob hero-blob-b" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-end gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-16 xl:py-20">
          <div className="hero-rise max-w-xl self-center">
            <BrandMark className="h-14 w-auto max-w-[14rem] sm:h-16 sm:max-w-[16rem]" />
            <h1 className="display mt-7 text-4xl leading-[1.08] tracking-tight text-heading sm:text-5xl lg:text-6xl">
              {t("heroTitleLead")}{" "}
              <span className="text-forest">{t("heroTitleAccent")}</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted sm:text-lg sm:leading-8">
              {t("heroBody")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/auctions" className="btn-primary">
                {t("browseLive")}
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/sell" className="btn-secondary">
                <span className="play-orb" aria-hidden="true">
                  ▶
                </span>
                {t("consignLot")}
              </Link>
            </div>
          </div>

          <div className="hero-rise-delay w-full lg:justify-self-end lg:pl-4">
            <HeroSlideshow slides={slides} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="mt-4">
          <h2 className="display section-title text-heading">{t("toBeAuctioned")}</h2>
          <p className="mt-2 text-sm text-muted">{t("toBeAuctionedBody")}</p>
          {scheduled.length ? (
            <div className="mt-5 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
              {scheduled.map((listing) => {
                const image = parseImages(listing.images)[0];
                return (
                  <Link
                    key={listing.id}
                    href={`/auctions/${listing.id}`}
                    className="panel w-72 shrink-0 snap-start overflow-hidden rounded-[1.4rem]"
                  >
                    <div className="relative h-40 bg-soft">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest">
                        {categoryName(locale, listing.category)} · {cityName(locale, listing.location)}
                      </p>
                      <h3 className="display text-xl leading-snug text-heading">{listing.title}</h3>
                      <p className="text-sm text-muted">
                        {t("opensOn", { date: formatDate(listing.startsAt, locale) })}
                      </p>
                      <p className="text-sm font-semibold text-forest">
                        {formatETB(listing.startingBid, locale)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="panel mt-5 rounded-[1.4rem] p-6 text-sm text-muted">{t("noneScheduled")}</p>
          )}
        </section>

        <section className="mt-14">
          <SectionHeading title={t("featuredLots")} href="/auctions?sort=price_desc" action={t("seeAll")} />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading title={t("endingSoon")} href="/auctions?status=ending" action={t("closingLots")} />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {endingSoon.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeading({ title, href, action }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="display section-title text-heading">{title}</h2>
      <Link href={href} className="shrink-0 text-sm font-semibold text-forest hover:underline">
        {action}
      </Link>
    </div>
  );
}
