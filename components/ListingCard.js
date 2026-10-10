import Link from "next/link";
import { effectiveEndsAt, formatETB, parseImages, statusLabel } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { categoryName, cityName, translate } from "@/lib/messages";
import { Countdown } from "./Countdown";

export async function ListingCard({ listing }) {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  const image = parseImages(listing.images)[0];
  const status = listing.computedStatus || listing.status;

  return (
    <article className="group overflow-hidden rounded-[1.4rem] border border-[color:var(--line)] bg-paper shadow-[var(--shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
      <Link href={`/auctions/${listing.id}`} className="block">
        <div className="relative aspect-[5/4] overflow-hidden bg-soft">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted">{t("noImage")}</div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              status === "LIVE"
                ? "bg-forest text-on"
                : status === "ENDED"
                  ? "bg-heading/80 text-on"
                  : status === "SOLD"
                    ? "bg-gold text-heading"
                    : "bg-orange text-on"
            }`}
          >
            {statusLabel(status, locale)}
          </span>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest">
            {categoryName(locale, listing.category)} · {cityName(locale, listing.location)}
          </p>
          <h3 className="display text-xl leading-snug text-heading">{listing.title}</h3>
          <div className="flex items-end justify-between gap-3 border-t border-[color:var(--line)] pt-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">{t("currentBid")}</p>
              <p className="text-lg font-semibold text-forest">
                {formatETB(listing.currentBid, locale)}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-muted">{t("bidsCount", { count: listing._count?.bids || 0 })}</p>
              <Countdown endsAt={effectiveEndsAt(listing)} className="font-semibold text-heading" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
