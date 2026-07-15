import { getMatchup } from "@/app/actions";
import { VoteMatchup } from "@/components/VoteMatchup";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const matchupResult = await getMatchup();

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-8 text-center sm:px-6 sm:pb-8 sm:pt-12 lg:pb-10 lg:pt-14">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-slate-400 sm:text-xs sm:tracking-[0.32em]">
          Vote
        </p>
        <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-normal leading-none tracking-[-0.04em] text-black sm:mt-4 sm:text-5xl lg:text-6xl">
          InternMash
        </h1>
        <h2 className="mx-auto mt-3 max-w-4xl text-2xl font-normal leading-tight tracking-[-0.035em] text-black sm:text-4xl lg:text-5xl">
          <span className="sm:hidden">Pick your internship</span>
          <span className="hidden sm:inline">Where would you rather intern?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-neutral-500 sm:mt-5 sm:text-lg sm:leading-7">
          Compare two programs at a time. The leaderboard moves as the
          community chooses.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-6">
        {matchupResult.ok ? (
          <>
            <VoteMatchup initialMatchup={matchupResult.data} />
            <p className="mx-auto mt-12 max-w-xl text-center text-sm font-medium leading-6 text-neutral-500">
              InternMash is a real-time matchmaking platform, essentially a
              &quot;Facemash&quot; for big tech internships and companies. Cast
              your votes on prestige, culture, and pay to help shape the live
              global leaderboard.
            </p>
          </>
        ) : (
          <section className="mx-auto max-w-xl border-y border-slate-200 py-10 text-center">
            <h2 className="text-3xl font-normal tracking-[-0.035em] text-black">
              Setup needed
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-neutral-500">
              {matchupResult.error}
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
