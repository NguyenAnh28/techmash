"use client";

import { CompanyLogo } from "@/components/CompanyLogo";
import type { Company } from "@/types/company";

interface CompanyCardProps {
  company: Company;
  disabled: boolean;
  isSelected: boolean;
  onVote: () => void;
}

export function CompanyCard({
  company,
  disabled,
  isSelected,
  onVote,
}: CompanyCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onVote}
      aria-label={`Vote for ${company.name}`}
      className={[
        "group flex min-h-[20rem] w-full flex-col items-center justify-center rounded-lg border p-8 text-center text-black outline-none transition-colors duration-200",
        disabled
          ? "cursor-not-allowed border-gray-300 bg-white opacity-70"
          : "border-black bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-black",
        isSelected ? "bg-gray-100" : "",
      ].join(" ")}
    >
      <div className="mb-8 flex h-28 w-full items-center justify-center">
        <CompanyLogo
          name={company.name}
          logoUrl={company.logo_url}
          className="max-h-24 max-w-40 object-contain"
          fallbackClassName="flex size-24 items-center justify-center rounded-2xl text-5xl font-medium"
        />
      </div>
      <span className="text-3xl font-medium tracking-normal sm:text-4xl">
        {company.name}
      </span>
      <span className="mt-4 rounded-full border border-gray-300 px-4 py-2 text-sm font-normal">
        {company.rating} Elo
      </span>
      <span className="mt-6 h-6 text-sm font-normal">
        {isSelected ? "Recording vote" : ""}
      </span>
    </button>
  );
}
