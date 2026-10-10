import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/messages";

export async function Footer() {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  return (
    <footer className="site-footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link href="/" className="inline-block" aria-label="Bid Ethiopia">
            <BrandMark className="h-14 w-auto max-w-[14rem]" />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted">{t("footerAbout")}</p>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">{t("browse")}</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-heading/80">
            <Link href="/auctions" className="hover:text-forest">
              {t("liveAuctions")}
            </Link>
            <Link href="/categories" className="hover:text-forest">
              {t("categories")}
            </Link>
            <Link href="/suppliers" className="hover:text-forest">
              {t("suppliers")}
            </Link>
            <Link href="/sell" className="hover:text-forest">
              {t("sellWithUs")}
            </Link>
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">{t("company")}</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-heading/80">
            <Link href="/about" className="hover:text-forest">
              {t("aboutHouse")}
            </Link>
            <a href="mailto:hello@bidethiopia.com" className="hover:text-forest">
              {t("contact")}
            </a>
          </div>
        </div>
        <div className="lg:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">{t("headOffice")}</p>
          <p className="mt-4 text-sm leading-7 text-muted">
            {t("officeAddress")}
            <br />
            +251 11 667 4400
            <br />
            {t("officeHours")}
          </p>
        </div>
      </div>
      <p className="border-t border-[color:var(--line)] px-4 py-5 text-center text-xs text-muted">
        {t("rights", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
