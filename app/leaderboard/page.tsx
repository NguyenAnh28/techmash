import { getLeaderboard } from "@/app/actions";
import { LeaderboardTable } from "@/components/LeaderboardTable";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboardResult = await getLeaderboard();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:py-16">
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Internship Index
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Leaderboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Community-ranked tech internship preferences, updated through Elo
            matchmaking.
          </p>
        </div>
        {leaderboardResult.ok ? (
          <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {leaderboardResult.data.length} companies
          </div>
        ) : null}
      </section>

      {leaderboardResult.ok ? (
        <LeaderboardTable companies={leaderboardResult.data} />
      ) : (
        <section className="rounded-2xl border border-slate-100 bg-white px-6 py-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Setup needed
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {leaderboardResult.error}
          </p>
        </section>
      )}
    </main>
  );
}
