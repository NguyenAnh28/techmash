"use client";

import { useState } from "react";
import { castVote, getMatchup } from "@/app/actions";
import { MatchupCard } from "@/components/MatchupCard";
import type { Company, Matchup } from "@/types/company";

interface VoteMatchupProps {
  initialMatchup: Matchup | null;
}

export function VoteMatchup({ initialMatchup }: VoteMatchupProps) {
  const [matchup, setMatchup] = useState<Matchup | null>(initialMatchup);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isSubmitting = selectedId !== null;

  async function handleVote(winner: Company, loser: Company) {
    if (isSubmitting) {
      return;
    }

    setSelectedId(winner.id);
    setError(null);

    const voteResult = await castVote(winner.id, loser.id);

    if (!voteResult.ok) {
      setError(voteResult.error);
      setSelectedId(null);
      return;
    }

    if (voteResult.data.nextMatchup) {
      setMatchup(voteResult.data.nextMatchup);
      setSelectedId(null);
      return;
    }

    const matchupResult = await getMatchup();

    if (matchupResult.ok) {
      setMatchup(matchupResult.data);
    } else {
      setError(matchupResult.error);
    }

    setSelectedId(null);
  }

  if (!matchup) {
    return (
      <section className="w-full max-w-xl rounded-2xl border border-slate-100 bg-white px-6 py-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Not enough companies
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          InternMash needs at least two seeded companies before voting can start.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full" aria-live="polite">
      <div className="relative grid w-full grid-cols-1 items-center justify-items-center gap-8 md:grid-cols-2">
        <MatchupCard
          company={matchup.companyA}
          disabled={isSubmitting}
          isSelected={selectedId === matchup.companyA.id}
          onVote={() => handleVote(matchup.companyA, matchup.companyB)}
        />

        <div className="flex justify-center md:absolute md:left-1/2 md:top-1/2 md:z-10 md:-translate-x-1/2 md:-translate-y-1/2">
          <span className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-400 shadow-sm">
            VS
          </span>
        </div>

        <MatchupCard
          company={matchup.companyB}
          disabled={isSubmitting}
          isSelected={selectedId === matchup.companyB.id}
          onVote={() => handleVote(matchup.companyB, matchup.companyA)}
        />
      </div>
      {error ? (
        <p className="mx-auto mt-6 max-w-xl rounded-xl border border-rose-100 bg-white px-4 py-3 text-center text-sm font-medium text-rose-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
