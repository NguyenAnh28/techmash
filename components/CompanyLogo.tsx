"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

interface CompanyLogoProps {
  name: string;
  logoUrl: string | null;
  className: string;
  fallbackClassName: string;
}

const THE_SVG_ICON_URL_PATTERN =
  /^https:\/\/thesvg\.org\/icons\/([^/]+)\/(default|dark|light)\.svg$/;

const FALLBACK_BADGE_CLASSES = [
  "bg-[#eef2ff] text-[#3730a3]",
  "bg-[#ecfeff] text-[#155e75]",
  "bg-[#f0fdf4] text-[#166534]",
  "bg-[#fff7ed] text-[#9a3412]",
  "bg-[#fdf2f8] text-[#9d174d]",
  "bg-[#f5f5f5] text-black",
];

function getTheSvgLogoParts(
  logoUrl: string | null,
): { slug: string; variant: string } | null {
  if (!logoUrl) {
    return null;
  }

  const match = THE_SVG_ICON_URL_PATTERN.exec(logoUrl);

  if (!match) {
    return null;
  }

  return {
    slug: match[1],
    variant: match[2],
  };
}

function getLogoUrlCandidates(logoUrl: string | null): string[] {
  if (!logoUrl) {
    return [];
  }

  const logoParts = getTheSvgLogoParts(logoUrl);

  if (!logoParts) {
    return [logoUrl];
  }

  const candidates = [logoUrl];

  if (logoParts.variant !== "default") {
    candidates.push(`https://thesvg.org/icons/${logoParts.slug}/default.svg`);
  }

  return candidates;
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
  logoUrl,
  className,
  fallbackClassName,
}: CompanyLogoProps) {
  const [failedLogoUrls, setFailedLogoUrls] = useState<string[]>([]);
  const logoUrlCandidates = useMemo(() => getLogoUrlCandidates(logoUrl), [logoUrl]);
  const resolvedLogoUrl = logoUrlCandidates.find(
    (candidate) => !failedLogoUrls.includes(candidate),
  );
  const initial = name.slice(0, 1).toUpperCase();

  if (resolvedLogoUrl) {
    return (
      <Image
        key={resolvedLogoUrl}
        src={resolvedLogoUrl}
        aria-label={`${name} logo`}
        alt={`${name} logo`}
        width={128}
        height={128}
        className={className}
        onError={() =>
          setFailedLogoUrls((currentFailedLogoUrls) => [
            ...currentFailedLogoUrls,
            resolvedLogoUrl,
          ])
        }
        unoptimized
      />
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
