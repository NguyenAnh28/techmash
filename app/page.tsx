import { getMatchup } from "@/app/actions";
import { VoteMatchup } from "@/components/VoteMatchup";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const matchupResult = await getMatchup();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-5xl flex-col items-center justify-center px-4 py-12">
      <section className="mb-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
          Community Internship Verdict
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Where would you rather intern?
        </h1>
      </section>

      {matchupResult.ok ? (
        <VoteMatchup initialMatchup={matchupResult.data} />
      ) : (
        <section className="w-full max-w-xl rounded-2xl border border-slate-100 bg-white px-6 py-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Setup needed
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {matchupResult.error}
          </p>
        </section>
      )}
    </main>
  );
}
