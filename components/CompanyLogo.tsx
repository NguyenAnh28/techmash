"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

interface CompanyLogoProps {
  name: string;
  domain: string | null;
  background?: string | null;
  className: string;
  fallbackClassName: string;
}

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

const FALLBACK_BADGE_CLASSES = [
  "bg-[#eef2ff] text-[#3730a3]",
  "bg-[#ecfeff] text-[#155e75]",
  "bg-[#f0fdf4] text-[#166534]",
  "bg-[#fff7ed] text-[#9a3412]",
  "bg-[#fdf2f8] text-[#9d174d]",
  "bg-[#f5f5f5] text-black",
];

function normalizeDomain(domain: string | null): string | null {
  const trimmedDomain = domain?.trim();

  if (!trimmedDomain) {
    return null;
  }

  return trimmedDomain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "");
}

function getLogoDevUrl(domain: string | null): string | null {
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain || !LOGO_DEV_TOKEN) {
    return null;
  }

  const params = new URLSearchParams({
    token: LOGO_DEV_TOKEN,
    fallback: "404",
    format: "png",
    size: "128",
  });

  return `https://img.logo.dev/${encodeURIComponent(normalizedDomain)}?${params.toString()}`;
}

function getFallbackBadgeClassName(name: string): string {
  const sum = Array.from(name).reduce(
    (currentSum, character) => currentSum + character.charCodeAt(0),
    0,
  );

  return FALLBACK_BADGE_CLASSES[sum % FALLBACK_BADGE_CLASSES.length];
}

export function CompanyLogo({
  name,
  domain,
  background = null,
  className,
  fallbackClassName,
}: CompanyLogoProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const logoUrl = useMemo(() => getLogoDevUrl(domain), [domain]);
  const imageFailed = logoUrl === failedLogoUrl;
  const initial = name.slice(0, 1).toUpperCase();

  if (logoUrl && !imageFailed) {
    function handleLogoError() {
      setFailedLogoUrl(logoUrl);
      trackAnalyticsEvent("logo_error", {
        company_name: name,
        domain: domain ?? null,
        background: background ?? null,
      });
    }

    const image = (
      <Image
        key={logoUrl}
        src={logoUrl}
        aria-label={`${name} logo`}
        alt={`${name} logo`}
        width={128}
        height={128}
        className={className}
        onError={handleLogoError}
      />
    );

    if (background === "dark") {
      return (
        <span className="inline-flex items-center justify-center rounded-xl bg-black p-2">
          {image}
        </span>
      );
    }

    return (
      image
    );
  }

  return (
    <span
      className={[
        fallbackClassName,
        getFallbackBadgeClassName(name),
      ].join(" ")}
    >
      {initial}
    </span>
  );
}
