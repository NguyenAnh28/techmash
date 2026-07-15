"use client";

import { CompanyProfileCard } from "@/components/CompanyProfileCard";
import type { Company } from "@/types/company";

interface MatchupCardProps {
  company: Company;
  disabled: boolean;
  isSelected: boolean;
  onVote: () => void;
}

export function MatchupCard({
  company,
  disabled,
  isSelected,
  onVote,
}: MatchupCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onVote}
      aria-label={`Vote to intern at ${company.name}`}
      className={[
        "group relative flex h-full w-full min-w-0 max-w-md cursor-pointer select-none flex-col overflow-hidden rounded-2xl border border-black/[0.04] bg-white px-0 py-4 text-left shadow-[0_18px_60px_rgba(15,23,42,0.06)] outline-none transition-all duration-200 md:rounded-3xl md:py-6",
        "hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(15,23,42,0.18)] focus-visible:ring-4 focus-visible:ring-slate-100",
        disabled ? "cursor-not-allowed opacity-70" : "",
        isSelected ? "shadow-[0_34px_90px_rgba(15,23,42,0.18)]" : "",
      ].join(" ")}
    >
      <CompanyProfileCard
        company={company}
        footer={
          <span className="mt-4 flex h-5 items-center justify-center text-xs font-bold text-black md:mt-6 md:h-6 md:text-sm">
            <span className="relative leading-none after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-black after:transition-transform after:duration-200 group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100">
              {isSelected ? "Recording verdict" : "Choose"}
            </span>
          </span>
        }
      />
    </button>
  );
}
