"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { CompanyLogo } from "@/components/CompanyLogo";
import { CompanyProfileCard } from "@/components/CompanyProfileCard";
import type {
  LeaderboardCompany,
  LeaderboardSortOption,
} from "@/types/company";
import { formatHourlyPay, formatLocation } from "@/utils/company-format";
import { calculateWinRate } from "@/utils/stats";

interface LeaderboardTableProps {
  companies: LeaderboardCompany[];
  page: number;
  pageSize: number;
  query: string;
  sort: LeaderboardSortOption;
  totalCompanyCount: number;
  totalCount: number;
  totalPages: number;
}

interface SelectedCompany {
  company: LeaderboardCompany;
  rank: number;
  winRate: number;
}

const sortOptions: {
  value: LeaderboardSortOption;
  label: string;
}[] = [
  {
    value: "elo",
    label: "Sort by Elo points",
  },
  {
    value: "salary",
    label: "Sort by Salary",
  },
  {
    value: "win-rate",
    label: "Sort by Win Rate",
  },
  {
    value: "matches",
    label: "Sort by Matches",
  },
];

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

function RankMovementTag({
  rankDelta,
}: {
  rankDelta: number | null;
}) {
  if (rankDelta === null) {
    return (
      <span className="inline-flex min-w-10 justify-center rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        New
      </span>
    );
  }

  if (rankDelta > 0) {
    return (
      <span
        aria-label={`Moved up ${rankDelta} ranks`}
        className="inline-flex min-w-10 items-center justify-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600"
      >
        <span aria-hidden="true">▲</span>
        {rankDelta}
      </span>
    );
  }

  if (rankDelta < 0) {
    const movedDown = Math.abs(rankDelta);

    return (
      <span
        aria-label={`Moved down ${movedDown} ranks`}
        className="inline-flex min-w-10 items-center justify-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-500"
      >
        <span aria-hidden="true">▼</span>
        {movedDown}
      </span>
    );
  }

  return (
    <span
      aria-label="Rank unchanged"
      className="inline-flex min-w-10 justify-center rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold text-slate-400"
    >
      -
    </span>
  );
}

function getLeaderboardHref({
  page,
  query,
  sort,
}: {
  page: number;
  query: string;
  sort: LeaderboardSortOption;
}) {
  const params = new URLSearchParams();
  const normalizedQuery = query.trim();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (sort !== "elo") {
    params.set("sort", sort);
  }

  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  }

  const queryString = params.toString();
  return queryString ? `/leaderboard?${queryString}` : "/leaderboard";
}

export function LeaderboardTable({
  companies,
  page,
  pageSize,
  query,
  sort,
  totalCompanyCount,
  totalCount,
  totalPages,
}: LeaderboardTableProps) {
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] =
    useState<SelectedCompany | null>(null);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchDebounceRef = useRef<number | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const activeQuery = query.trim();
  const isSearching = activeQuery.length > 0;
  const visibleCompanies = companies;
  const firstVisibleCompany =
    totalCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const lastVisibleCompany = Math.min(page * pageSize, totalCount);
  const selectedSortLabel =
    sortOptions.find((option) => option.value === sort)?.label ??
    sortOptions[0].label;

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current !== null) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSortMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setIsSortMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSortMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSortMenuOpen]);

  function replaceLeaderboardSearch(nextQuery: string) {
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
    }

    if (nextQuery === activeQuery) {
      return;
    }

    searchDebounceRef.current = window.setTimeout(() => {
      searchDebounceRef.current = null;
      router.replace(
        getLeaderboardHref({
          page: 1,
          query: nextQuery,
          sort,
        }),
      );
    }, 250);
  }

  function handleSortChange(nextSort: LeaderboardSortOption) {
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    setIsSortMenuOpen(false);
    router.push(
      getLeaderboardHref({
        page: 1,
        query: searchInputRef.current?.value.trim() ?? activeQuery,
        sort: nextSort,
      }),
    );
  }

  function handleOpenCompany(
    company: LeaderboardCompany,
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

  if (totalCompanyCount === 0) {
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
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:max-w-2xl sm:flex-row">
          <label className="sr-only" htmlFor="leaderboard-search">
            Search companies
          </label>
          <input
            key={query}
            ref={searchInputRef}
            id="leaderboard-search"
            type="search"
            defaultValue={query}
            onChange={(event) =>
              replaceLeaderboardSearch(event.target.value.trim())
            }
            placeholder="Search companies"
            className="h-12 w-full rounded-2xl border border-black/[0.06] bg-white px-4 text-base font-medium text-black shadow-[0_12px_40px_rgba(15,23,42,0.05)] outline-none transition-colors placeholder:text-slate-300 focus:border-black/[0.16] focus:ring-4 focus:ring-slate-100"
          />
          <div ref={sortMenuRef} className="relative w-full sm:w-64">
            <button
              id="leaderboard-sort"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isSortMenuOpen}
              onClick={() => setIsSortMenuOpen((isOpen) => !isOpen)}
              className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 text-left text-sm font-bold text-black shadow-[0_12px_40px_rgba(15,23,42,0.05)] outline-none transition-colors hover:bg-neutral-50 focus:border-black/[0.16] focus:ring-4 focus:ring-slate-100"
            >
              <span className="truncate">{selectedSortLabel}</span>
              <span
                aria-hidden="true"
                className={[
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] text-slate-400 transition-transform duration-200",
                  isSortMenuOpen ? "rotate-180" : "",
                ].join(" ")}
              >
                ▼
              </span>
            </button>
            {isSortMenuOpen ? (
              <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-full overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                <div
                  role="listbox"
                  aria-labelledby="leaderboard-sort"
                  className="flex flex-col gap-1"
                >
                  {sortOptions.map((option) => {
                    const isSelected = option.value === sort;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSortChange(option.value)}
                        className={[
                          "flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-bold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-slate-100",
                          isSelected
                            ? "bg-neutral-100 text-black"
                            : "text-neutral-500 hover:bg-neutral-50 hover:text-black",
                        ].join(" ")}
                      >
                        <span>{option.label}</span>
                        {isSelected ? (
                          <span aria-hidden="true" className="text-xs">
                            ✓
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-neutral-500">
          <span>
            {isSearching
              ? `${totalCount} result${
                  totalCount === 1 ? "" : "s"
                }`
              : `${totalCompanyCount} companies`}
          </span>
          {isSearching ? (
            <button
              type="button"
              onClick={() => {
                if (searchInputRef.current) {
                  searchInputRef.current.value = "";
                }

                if (searchDebounceRef.current !== null) {
                  window.clearTimeout(searchDebounceRef.current);
                  searchDebounceRef.current = null;
                }

                router.replace(
                  getLeaderboardHref({
                    page: 1,
                    query: "",
                    sort,
                  }),
                );
              }}
              className="rounded-xl px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/[0.04] bg-white px-5 pt-1 shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
        {visibleCompanies.length === 0 ? (
          <section className="px-6 py-12 text-center">
            <h2 className="text-3xl font-normal tracking-[-0.035em] text-black">
              No matches
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-neutral-500">
              No companies matched “{activeQuery}”. Try a shorter name.
            </p>
          </section>
        ) : (
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
                {visibleCompanies.map((company) => {
                  const winRate = calculateWinRate(
                    company.votes_won,
                    company.total_matches,
                  );
                  const rank = company.rank;

                  return (
                    <tr
                      key={company.id}
                      className="bg-white text-neutral-500 transition-colors hover:bg-neutral-50/70"
                    >
                      <td className="py-6 pl-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-normal text-black">
                            #{rank}
                          </span>
                          <RankMovementTag rankDelta={company.rankDelta} />
                        </div>
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
        )}
      </div>
      {totalPages > 1 ? (
        <nav
          aria-label="Leaderboard pages"
          className="mt-6 flex flex-col gap-4 rounded-3xl border border-black/[0.04] bg-white px-5 py-4 text-sm font-medium text-neutral-500 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Showing {firstVisibleCompany}-{lastVisibleCompany} of {totalCount}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {page > 1 ? (
              <Link
                href={getLeaderboardHref({
                  page: page - 1,
                  query: activeQuery,
                  sort,
                })}
                className="rounded-xl px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300">
                Previous
              </span>
            )}
            <span className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-medium text-black">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={getLeaderboardHref({
                  page: page + 1,
                  query: activeQuery,
                  sort,
                })}
                className="rounded-xl px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300">
                Next
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={getLeaderboardHref({
                  page: totalPages,
                  query: activeQuery,
                  sort,
                })}
                className="rounded-xl px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
              >
                Last
              </Link>
            ) : (
              <span className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300">
                Last
              </span>
            )}
          </div>
        </nav>
      ) : null}
      <CompanyDetailModal
        selectedCompany={selectedCompany}
        onClose={handleCloseCompany}
      />
    </>
  );
}
