"use client";

import { CompanyLogo } from "@/components/CompanyLogo";
import type { Company } from "@/types/company";

interface MatchupCardProps {
  company: Company;
  disabled: boolean;
  isSelected: boolean;
  onVote: () => void;
}

function formatHourlyPay(hourlyPay: number | null) {
  return hourlyPay === null ? "Not listed" : `$${hourlyPay}/hr`;
}

function formatSubmissions(numSubmits: number | null) {
  if (numSubmits === null) {
    return "No reports";
  }

  return `${numSubmits} ${numSubmits === 1 ? "report" : "reports"}`;
}

function formatLocation(housingPerk: string | null) {
  const location = housingPerk?.trim();

  if (!location) {
    return "Location not listed";
  }

  return location.replace(/^relocation to\s+/i, "");
}

export function MatchupCard({
  company,
  disabled,
  isSelected,
  onVote,
}: MatchupCardProps) {
  const location = formatLocation(company.housing_perk);
  const signaturePerk =
    company.signature_perk ??
    "Internship details will be added when this company appears in the dataset.";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onVote}
      aria-label={`Vote to intern at ${company.name}`}
      className={[
        "group relative flex h-full w-full max-w-md cursor-pointer select-none flex-col overflow-hidden rounded-3xl border border-black/[0.04] bg-white px-0 py-6 text-left shadow-[0_18px_60px_rgba(15,23,42,0.06)] outline-none transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(15,23,42,0.18)] focus-visible:ring-4 focus-visible:ring-slate-100",
        disabled ? "cursor-not-allowed opacity-70" : "",
        isSelected ? "shadow-[0_34px_90px_rgba(15,23,42,0.18)]" : "",
      ].join(" ")}
    >
      <div className="flex flex-col items-center px-4 text-center sm:px-6">
        <div className="flex h-24 w-full items-center justify-center rounded-2xl border border-slate-100 bg-neutral-50 px-6">
          <CompanyLogo
            name={company.name}
            domain={company.logo_domain ?? company.domain}
            background={company.logo_background}
            className="max-h-16 max-w-40 object-contain"
            fallbackClassName="flex size-16 items-center justify-center rounded-2xl text-2xl font-normal"
          />
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
          {company.rating} Elo
        </p>
        <h2 className="mt-3 max-w-full text-3xl font-normal tracking-[-0.04em] text-black [overflow-wrap:anywhere] sm:text-4xl">
          {company.name}
        </h2>
      </div>

      <div className="mx-4 my-6 overflow-hidden rounded-2xl border border-slate-200 text-sm sm:mx-5">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Hourly Pay
          </span>
          <span className="text-base font-medium text-black">
            {formatHourlyPay(company.hourly_pay)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3.5 sm:px-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Data Reports
          </span>
          <span className="text-base font-medium text-black">
            {formatSubmissions(company.num_submits)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3.5 sm:px-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Location
          </span>
          <span className="max-w-[220px] truncate text-right text-base font-medium text-black">
            {location}
          </span>
        </div>
      </div>

      <div className="mx-4 mt-auto px-4 sm:mx-5 sm:px-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
          Internship Detail
        </p>
        <p className="line-clamp-2 text-base font-medium leading-7 text-neutral-500">
          {signaturePerk}
        </p>
      </div>

      <span className="mt-6 flex h-6 items-center justify-center text-sm font-bold text-black">
        <span className="relative leading-none after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-black after:transition-transform after:duration-200 group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100">
          {isSelected ? "Recording verdict" : "Choose"}
        </span>
      </span>
    </button>
  );
}
