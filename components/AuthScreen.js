"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { BrandMark } from "@/components/BrandMark";
import { useI18n } from "@/components/LocaleProvider";

function AuthScreenForm({ mode }) {
  const params = useSearchParams();
  return (
    <AuthForm mode={mode} next={params.get("next") || "/dashboard"} />
  );
}

export function AuthScreen({ mode }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
      <div className="panel hidden overflow-hidden rounded-[1.5rem] bg-soft p-10 lg:block">
        <BrandMark className="h-14 w-auto max-w-[14rem]" />
        <p className="display mt-8 text-5xl leading-none text-heading">{t("authHeadline")}</p>
        <p className="mt-4 max-w-sm text-sm leading-7 text-muted">{t("authBody")}</p>
      </div>
      <Suspense fallback={<div className="mx-auto h-80 max-w-md" />}>
        <AuthScreenForm mode={mode} />
      </Suspense>
    </div>
  );
}
