import { getMatchup } from "@/app/actions";
import { VoteMatchup } from "@/components/VoteMatchup";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const matchupResult = await getMatchup();

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-12 text-center sm:px-6 lg:pb-10 lg:pt-14">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-slate-400">
          Vote
        </p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-normal tracking-[-0.04em] text-black sm:text-5xl lg:text-6xl">
          Where would you rather intern?
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-neutral-500 sm:text-lg">
          Compare two programs at a time. The leaderboard quietly moves as the
          community chooses.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-6">
        {matchupResult.ok ? (
          <VoteMatchup initialMatchup={matchupResult.data} />
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
