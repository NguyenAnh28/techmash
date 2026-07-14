import { getLeaderboard } from "@/app/actions";
import { LeaderboardRefreshTimer } from "@/components/LeaderboardRefreshTimer";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

const LEADERBOARD_PAGE_SIZE = 20;

interface LeaderboardPageProps {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
}

function parsePageParam(page: string | string[] | undefined) {
  const value = Array.isArray(page) ? page[0] : page;
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getLeaderboardPageHref(page: number) {
  return page <= 1 ? "/leaderboard" : `/leaderboard?page=${page}`;
}

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedPage = parsePageParam(resolvedSearchParams?.page);
  const leaderboardResult = await getLeaderboard(
    requestedPage,
    LEADERBOARD_PAGE_SIZE,
  );
  const leaderboard = leaderboardResult.ok ? leaderboardResult.data : null;
  const leaderboardError = leaderboardResult.ok ? null : leaderboardResult.error;
  const firstVisibleCompany =
    leaderboard && leaderboard.totalCount > 0
      ? (leaderboard.page - 1) * leaderboard.pageSize + 1
      : 0;
  const lastVisibleCompany = leaderboard
    ? Math.min(leaderboard.page * leaderboard.pageSize, leaderboard.totalCount)
    : 0;

  return (
    <main className="bg-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-5 pb-12 pt-16 sm:px-6 md:flex-row md:items-end md:justify-between lg:pb-16 lg:pt-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-slate-400">
            Rankings
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-normal tracking-[-0.04em] text-black sm:text-6xl lg:text-7xl">
            The internship index.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-7 text-neutral-500 sm:text-xl sm:leading-8">
            Community-ranked internship preferences, updated through Elo
            matchmaking.
          </p>
        </div>
        {leaderboard ? (
          <div className="w-full shrink-0 border-y border-slate-200 py-4 text-left md:w-64 md:text-right">
            <p className="text-4xl font-normal tracking-[-0.04em] text-black">
              {leaderboard.totalCount}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
              Companies
            </p>
            <LeaderboardRefreshTimer
              lastRefreshedAt={leaderboard.lastRefreshedAt}
              nextRefreshAt={leaderboard.nextRefreshAt}
              refreshIntervalSeconds={leaderboard.refreshIntervalSeconds}
              refreshTimeZone={leaderboard.refreshTimeZone}
            />
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-6">
        {leaderboard ? (
          <>
            <LeaderboardTable
              companies={leaderboard.companies}
              rankOffset={(leaderboard.page - 1) * leaderboard.pageSize}
            />
            {leaderboard.totalPages > 1 ? (
              <nav
                aria-label="Leaderboard pages"
                className="mt-6 flex flex-col gap-4 rounded-3xl border border-black/[0.04] bg-white px-5 py-4 text-sm font-medium text-neutral-500 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  Showing {firstVisibleCompany}-{lastVisibleCompany} of{" "}
                  {leaderboard.totalCount}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {leaderboard.page > 1 ? (
                    <Link
                      href={getLeaderboardPageHref(leaderboard.page - 1)}
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
                    Page {leaderboard.page} of {leaderboard.totalPages}
                  </span>
                  {leaderboard.page < leaderboard.totalPages ? (
                    <Link
                      href={getLeaderboardPageHref(leaderboard.page + 1)}
                      className="rounded-xl px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300">
                      Next
                    </span>
                  )}
                </div>
              </nav>
            ) : null}
          </>
        ) : (
          <section className="mx-auto max-w-xl border-y border-slate-200 py-10 text-center">
            <h2 className="text-3xl font-normal tracking-[-0.035em] text-black">
              Setup needed
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-neutral-500">
              {leaderboardError}
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
