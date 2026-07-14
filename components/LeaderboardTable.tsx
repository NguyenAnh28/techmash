"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { CompanyLogo } from "@/components/CompanyLogo";
import { CompanyProfileCard } from "@/components/CompanyProfileCard";
import type { Company } from "@/types/company";
import { formatHourlyPay, formatLocation } from "@/utils/company-format";
import { calculateWinRate } from "@/utils/stats";

interface LeaderboardTableProps {
  companies: Company[];
  rankOffset?: number;
}

interface SelectedCompany {
  company: Company;
  rank: number;
  winRate: number;
}

function CompanyDetailModal({
  selectedCompany,
  onClose,
}: {
  selectedCompany: SelectedCompany | null;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!selectedCompany) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, selectedCompany]);

  if (!selectedCompany) {
    return null;
  }

  const { company, rank, winRate } = selectedCompany;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 px-4 py-8 backdrop-blur-sm sm:px-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="company-detail-title"
        aria-modal="true"
        role="dialog"
        className="relative w-full max-w-md"
      >
        <h2 id="company-detail-title" className="sr-only">
          {company.name} internship details
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close company details"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-xl border-[1.5px] border-black/[0.07] bg-white text-2xl font-normal leading-none text-black shadow-[0_12px_30px_rgba(15,23,42,0.08)] outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-4 focus-visible:ring-slate-100"
        >
          X
        </button>
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto rounded-3xl">
          <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden rounded-3xl border-[1.5px] border-black/[0.07] bg-white px-0 py-6 text-left shadow-[0_42px_120px_rgba(15,23,42,0.24)]">
            <CompanyProfileCard
              company={company}
              footer={
                <div className="mx-4 mt-6 grid grid-cols-2 gap-2 text-center sm:mx-5">
                  <div className="rounded-2xl bg-neutral-50 px-3 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Rank
                    </p>
                    <p className="mt-1 text-sm font-bold text-black">
                      #{rank}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 px-3 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Win Rate
                    </p>
                    <p className="mt-1 text-sm font-bold text-black">
                      {winRate}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 px-3 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Wins
                    </p>
                    <p className="mt-1 text-sm font-bold text-black">
                      {company.votes_won}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 px-3 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      Matches
                    </p>
                    <p className="mt-1 text-sm font-bold text-black">
                      {company.total_matches}
                    </p>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export function LeaderboardTable({
  companies,
  rankOffset = 0,
}: LeaderboardTableProps) {
  const [selectedCompany, setSelectedCompany] =
    useState<SelectedCompany | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function handleOpenCompany(
    company: Company,
    rank: number,
    winRate: number,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    triggerRef.current = event.currentTarget;
    setSelectedCompany({
      company,
      rank,
      winRate,
    });
  }

  function handleCloseCompany() {
    setSelectedCompany(null);
    window.setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  }

  if (companies.length === 0) {
    return (
      <section className="rounded-3xl border border-black/[0.04] bg-white px-6 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
        <h2 className="text-3xl font-normal tracking-[-0.035em] text-black">
          No companies yet
        </h2>
        <p className="mt-3 text-base font-medium leading-7 text-neutral-500">
          Seed the Supabase database to start the leaderboard.
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-black/[0.04] bg-white px-5 pt-1 shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="border-b border-slate-200 text-[11px] uppercase tracking-[0.32em] text-slate-400">
              <tr>
                <th className="w-20 py-5 pl-3 pr-4 font-bold">Rank</th>
                <th className="py-5 pl-8 pr-4 font-bold">Company</th>
                <th className="px-4 py-5 font-bold">Elo</th>
                <th className="px-8 py-5 text-center font-bold">Salary</th>
                <th className="px-4 py-5 font-bold">Location</th>
                <th className="py-5 pl-4 font-bold">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {companies.map((company, index) => {
                const winRate = calculateWinRate(
                  company.votes_won,
                  company.total_matches,
                );
                const rank = rankOffset + index + 1;

                return (
                  <tr
                    key={company.id}
                    className="bg-white text-neutral-500 transition-colors hover:bg-neutral-50/70"
                  >
                    <td className="py-6 pl-3 pr-4 text-lg font-normal text-black">
                      #{rank}
                    </td>
                    <td className="py-6 pl-8 pr-4">
                      <button
                        type="button"
                        onClick={(event) =>
                          handleOpenCompany(company, rank, winRate, event)
                        }
                        className="group flex min-w-48 items-center gap-3 rounded-xl text-left outline-none transition-colors focus-visible:ring-4 focus-visible:ring-slate-100"
                      >
                        <CompanyLogo
                          name={company.name}
                          domain={company.logo_domain ?? company.domain}
                          background={company.logo_background}
                          className="size-9 shrink-0 object-contain"
                          fallbackClassName="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-normal"
                        />
                        <span className="text-xl font-normal tracking-[-0.025em] text-black transition-colors group-hover:text-neutral-500">
                          {company.name}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-6 font-medium text-black">
                      {company.rating}
                    </td>
                    <td className="whitespace-nowrap px-8 py-6 text-center font-medium text-black">
                      {formatHourlyPay(company.hourly_pay)}
                    </td>
                    <td className="px-4 py-6">
                      <span className="block max-w-48 truncate">
                        {formatLocation(company.housing_perk)}
                      </span>
                    </td>
                    <td className="py-6 pl-4">
                      <span className="text-sm font-bold text-black">
                        {winRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <CompanyDetailModal
        selectedCompany={selectedCompany}
        onClose={handleCloseCompany}
      />
    </>
  );
}
