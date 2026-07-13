"use client";

import { CompanyLogo } from "@/components/CompanyLogo";
import type { Company } from "@/types/company";

interface InternshipMetrics {
  hourlyPay: string;
  returnOfferRate: string;
  housingAllowance: string;
  topInternPerk: string;
}

interface MatchupCardProps {
  company: Company;
  disabled: boolean;
  isSelected: boolean;
  onVote: () => void;
}

const DEFAULT_INTERNSHIP_METRICS: InternshipMetrics = {
  hourlyPay: "$48/hr",
  returnOfferRate: "72%",
  housingAllowance: "Relocation support",
  topInternPerk: "High-ownership projects with mentor support and strong resume signal.",
};

const INTERNSHIP_METRICS_BY_COMPANY: Record<string, InternshipMetrics> = {
  Airbnb: {
    hourlyPay: "$52/hr",
    returnOfferRate: "70%",
    housingAllowance: "$7k housing stipend",
    topInternPerk: "Design-minded product work with generous travel and housing support.",
  },
  Apple: {
    hourlyPay: "$53/hr",
    returnOfferRate: "68%",
    housingAllowance: "Corporate housing options",
    topInternPerk: "Hardware and software projects with a polished launch culture.",
  },
  Google: {
    hourlyPay: "$55/hr",
    returnOfferRate: "74%",
    housingAllowance: "$9k relocation package",
    topInternPerk: "Large-scale engineering problems with deep mentorship infrastructure.",
  },
  Meta: {
    hourlyPay: "$57/hr",
    returnOfferRate: "73%",
    housingAllowance: "$8k housing stipend",
    topInternPerk: "Fast product cycles and intern projects that often ship publicly.",
  },
  Microsoft: {
    hourlyPay: "$50/hr",
    returnOfferRate: "76%",
    housingAllowance: "Corporate housing support",
    topInternPerk: "Stable mentorship, broad team choice, and polished intern programming.",
  },
  Netflix: {
    hourlyPay: "$60/hr",
    returnOfferRate: "62%",
    housingAllowance: "Relocation reimbursement",
    topInternPerk: "Lean teams, senior exposure, and unusually high project ownership.",
  },
  Nvidia: {
    hourlyPay: "$56/hr",
    returnOfferRate: "71%",
    housingAllowance: "$8k relocation support",
    topInternPerk: "Front-row work on AI accelerators, graphics, and data center systems.",
  },
  OpenAI: {
    hourlyPay: "$65/hr",
    returnOfferRate: "64%",
    housingAllowance: "Premium relocation support",
    topInternPerk: "Research-adjacent product work at the center of applied AI.",
  },
  SpaceX: {
    hourlyPay: "$44/hr",
    returnOfferRate: "66%",
    housingAllowance: "Relocation assistance",
    topInternPerk: "Mission-driven engineering with direct exposure to production hardware.",
  },
  Stripe: {
    hourlyPay: "$58/hr",
    returnOfferRate: "75%",
    housingAllowance: "$10k housing stipend",
    topInternPerk: "Elegant infrastructure work with unusually clear engineering standards.",
  },
  Uber: {
    hourlyPay: "$51/hr",
    returnOfferRate: "69%",
    housingAllowance: "$7.5k stipend",
    topInternPerk: "Marketplace, mapping, and mobility systems at global scale.",
  },
  Vercel: {
    hourlyPay: "$49/hr",
    returnOfferRate: "67%",
    housingAllowance: "Remote-friendly stipend",
    topInternPerk: "Developer-tooling work with tight feedback from modern web teams.",
  },
};

function getInternshipMetrics(companyName: string): InternshipMetrics {
  return INTERNSHIP_METRICS_BY_COMPANY[companyName] ?? DEFAULT_INTERNSHIP_METRICS;
}

export function MatchupCard({
  company,
  disabled,
  isSelected,
  onVote,
}: MatchupCardProps) {
  const metrics = getInternshipMetrics(company.name);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onVote}
      aria-label={`Vote to intern at ${company.name}`}
      className={[
        "group relative flex w-full max-w-sm cursor-pointer select-none flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] outline-none transition-all duration-300",
        "hover:border-indigo-500/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] focus-visible:border-indigo-500/40 focus-visible:ring-4 focus-visible:ring-indigo-100",
        disabled ? "cursor-not-allowed opacity-70" : "",
        isSelected ? "border-indigo-500/40 shadow-[0_20px_50px_rgba(79,70,229,0.12)]" : "",
      ].join(" ")}
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex h-24 w-full items-center justify-center rounded-xl border border-slate-100 bg-slate-50/60 px-6">
          <CompanyLogo
            name={company.name}
            logoUrl={company.logo_url}
            className="max-h-16 max-w-36 object-contain"
            fallbackClassName="flex size-16 items-center justify-center rounded-2xl text-3xl font-bold"
          />
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {company.name}
          </h2>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {company.rating} Elo
          </span>
        </div>
      </div>

      <div className="my-4 space-y-3 border-t border-slate-100 pt-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-slate-500">Hourly Pay</span>
          <span className="rounded-md border border-emerald-200/40 bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-700">
            {metrics.hourlyPay}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-slate-500">Return Offer Rate</span>
          <span className="rounded-md border border-indigo-200/40 bg-indigo-50 px-2 py-0.5 text-sm font-bold text-indigo-700">
            {metrics.returnOfferRate}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-slate-500">Housing Allowance</span>
          <span className="max-w-[180px] truncate text-right text-xs font-medium text-slate-600">
            {metrics.housingAllowance}
          </span>
        </div>
      </div>

      <div className="mt-auto rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Top Intern Perk
        </p>
        <p className="line-clamp-2 text-xs font-medium italic text-slate-700">
          {metrics.topInternPerk}
        </p>
      </div>

      <span className="mt-4 h-4 text-center text-xs font-medium text-indigo-600">
        {isSelected ? "Recording verdict" : ""}
      </span>
    </button>
  );
}
