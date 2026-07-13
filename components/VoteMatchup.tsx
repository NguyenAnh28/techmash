"use client";

import { useState } from "react";
import { useEffect } from "react";
import { castVote, getMatchup } from "@/app/actions";
import { MatchupCard } from "@/components/MatchupCard";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { Company, Matchup } from "@/types/company";

interface VoteMatchupProps {
  initialMatchup: Matchup | null;
}

export function VoteMatchup({ initialMatchup }: VoteMatchupProps) {
  const [matchup, setMatchup] = useState<Matchup | null>(initialMatchup);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isSubmitting = selectedId !== null;
  const matchupKey = matchup
    ? `${matchup.companyA.id}:${matchup.companyB.id}`
    : null;

  useEffect(() => {
    if (!matchup) {
      return;
    }

    trackAnalyticsEvent("matchup_view", {
      company_a_id: matchup.companyA.id,
      company_a_name: matchup.companyA.name,
      company_b_id: matchup.companyB.id,
      company_b_name: matchup.companyB.name,
    });
  }, [matchup, matchupKey]);

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

    trackAnalyticsEvent("vote_cast", {
      winner_id: winner.id,
      winner_name: winner.name,
      loser_id: loser.id,
      loser_name: loser.name,
      winner_rating_before: winner.rating,
      loser_rating_before: loser.rating,
      winner_rating_after: voteResult.data.ratings?.winner_new_rating ?? null,
      loser_rating_after: voteResult.data.ratings?.loser_new_rating ?? null,
    });

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
      <section className="mx-auto max-w-xl border-y border-slate-200 py-10 text-center">
        <h2 className="text-3xl font-normal tracking-[-0.035em] text-black">
          Not enough companies
        </h2>
        <p className="mt-3 text-base font-medium leading-7 text-neutral-500">
          InternMash needs at least two seeded companies before voting can start.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full" aria-live="polite">
      <div className="relative grid w-full grid-cols-1 items-stretch justify-items-center gap-10 md:grid-cols-2 md:gap-16">
        <MatchupCard
          company={matchup.companyA}
          disabled={isSubmitting}
          isSelected={selectedId === matchup.companyA.id}
          onVote={() => handleVote(matchup.companyA, matchup.companyB)}
        />

        <div className="flex justify-center md:absolute md:left-1/2 md:top-10 md:z-10 md:-translate-x-1/2">
          <span className="flex size-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold tracking-[0.2em] text-slate-400">
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
        <p className="mx-auto mt-8 max-w-xl border-y border-rose-200 px-4 py-4 text-center text-sm font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
