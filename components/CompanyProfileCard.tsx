"use client";

import type { ReactNode } from "react";
import { CompanyLogo } from "@/components/CompanyLogo";
import type { Company } from "@/types/company";
import {
  formatHourlyPay,
  formatLocation,
  formatSubmissions,
} from "@/utils/company-format";

interface CompanyProfileCardProps {
  company: Company;
  footer: ReactNode;
}

export function CompanyProfileCard({
  company,
  footer,
}: CompanyProfileCardProps) {
  const location = formatLocation(company.housing_perk);
  const signaturePerk =
    company.signature_perk ??
    "Internship details will be added when this company appears in the dataset.";

  return (
    <>
      <div className="flex min-w-0 flex-col items-center px-2 text-center md:px-6">
        <div className="flex h-16 w-full items-center justify-center rounded-xl border border-slate-100 bg-neutral-50 px-3 md:h-24 md:rounded-2xl md:px-6">
          <CompanyLogo
            name={company.name}
            domain={company.logo_domain ?? company.domain}
            background={company.logo_background}
            className="max-h-10 max-w-24 object-contain md:max-h-16 md:max-w-40"
            fallbackClassName="flex size-10 items-center justify-center rounded-xl text-base font-normal md:size-16 md:rounded-2xl md:text-2xl"
          />
        </div>

        <p className="mt-3 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-slate-400 md:mt-5 md:text-[11px] md:tracking-[0.32em]">
          {company.rating} Elo
        </p>
        <h2 className="mt-2 line-clamp-2 max-w-full text-lg font-normal leading-tight tracking-[-0.025em] text-black [overflow-wrap:anywhere] md:mt-3 md:text-4xl md:tracking-[-0.04em]">
          {company.name}
        </h2>
      </div>

      <div className="mx-2 my-4 overflow-hidden rounded-xl border border-slate-200 text-xs md:mx-5 md:my-6 md:rounded-2xl md:text-sm">
        <div className="flex flex-col gap-1 px-2 py-2.5 md:flex-row md:items-center md:justify-between md:gap-4 md:px-5 md:py-3.5">
          <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-400 md:text-[11px] md:tracking-[0.28em]">
            Salary
          </span>
          <span className="text-sm font-medium text-black md:text-base">
            {formatHourlyPay(company.hourly_pay)}
          </span>
        </div>
        <div className="flex flex-col gap-1 border-t border-slate-200 px-2 py-2.5 md:flex-row md:items-center md:justify-between md:gap-4 md:px-5 md:py-3.5">
          <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-400 md:text-[11px] md:tracking-[0.28em]">
            Reports
          </span>
          <span className="text-sm font-medium text-black md:text-base">
            {formatSubmissions(company.num_submits)}
          </span>
        </div>
        <div className="flex flex-col gap-1 border-t border-slate-200 px-2 py-2.5 md:flex-row md:items-center md:justify-between md:gap-4 md:px-5 md:py-3.5">
          <span className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-400 md:text-[11px] md:tracking-[0.28em]">
            Location
          </span>
          <span className="max-w-full truncate text-sm font-medium text-black md:max-w-[220px] md:text-right md:text-base">
            {location}
          </span>
        </div>
      </div>

      <div className="mx-5 mt-auto hidden px-5 md:block">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
          Internship Detail
        </p>
        <p className="line-clamp-2 text-base font-medium leading-7 text-neutral-500">
          {signaturePerk}
        </p>
      </div>

      {footer}
    </>
  );
}
