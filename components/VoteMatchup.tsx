"use client";

import { useState } from "react";
import { castVote, getMatchup } from "@/app/actions";
import { CompanyCard } from "@/components/CompanyCard";
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
      <section className="rounded-lg border border-gray-300 bg-white px-6 py-8 text-center">
        <h2 className="text-2xl font-medium text-black">Not enough companies</h2>
        <p className="mt-3 text-sm leading-6 text-black">
          TechMash needs at least two seeded companies before voting can start.
        </p>
      </section>
    );
  }

  return (
    <section aria-live="polite">
      <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <CompanyCard
          company={matchup.companyA}
          disabled={isSubmitting}
          isSelected={selectedId === matchup.companyA.id}
          onVote={() => handleVote(matchup.companyA, matchup.companyB)}
        />
        <div className="flex justify-center">
          <span className="flex size-14 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-medium text-black">
            VS
          </span>
        </div>
        <CompanyCard
          company={matchup.companyB}
          disabled={isSubmitting}
          isSelected={selectedId === matchup.companyB.id}
          onVote={() => handleVote(matchup.companyB, matchup.companyA)}
        />
      </div>
      {error ? (
        <p className="mt-6 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-normal text-black">
          {error}
        </p>
      ) : null}
    </section>
  );
}
