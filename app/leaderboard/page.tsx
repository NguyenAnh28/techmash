import { getLeaderboard } from "@/app/actions";
import { LeaderboardTable } from "@/components/LeaderboardTable";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboardResult = await getLeaderboard();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:py-14">
      <section className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase text-black">
            Global standings
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-normal text-black sm:text-6xl">
            Leaderboard
          </h1>
        </div>
        {leaderboardResult.ok ? (
          <div className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-normal text-black">
            {leaderboardResult.data.length} companies
          </div>
        ) : null}
      </section>

      {leaderboardResult.ok ? (
        <LeaderboardTable companies={leaderboardResult.data} />
      ) : (
        <section className="rounded-lg border border-gray-300 bg-white px-6 py-8">
          <h2 className="text-2xl font-medium text-black">Setup needed</h2>
          <p className="mt-3 text-sm leading-6 text-black">
            {leaderboardResult.error}
          </p>
        </section>
      )}
    </main>
  );
}
