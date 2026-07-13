import { CompanyLogo } from "@/components/CompanyLogo";
import type { Company } from "@/types/company";
import { calculateWinRate } from "@/utils/stats";

interface LeaderboardTableProps {
  companies: Company[];
  rankOffset?: number;
}

export function LeaderboardTable({
  companies,
  rankOffset = 0,
}: LeaderboardTableProps) {
  if (companies.length === 0) {
    return (
      <section className="rounded-3xl border border-black/[0.04] bg-white px-6 py-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
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
    <div className="overflow-hidden rounded-3xl border border-black/[0.04] bg-white px-5 pt-1 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="border-b border-slate-200 text-[11px] uppercase tracking-[0.32em] text-slate-400">
            <tr>
              <th className="w-20 py-5 pl-3 pr-4 font-bold">Rank</th>
              <th className="py-5 pl-8 pr-4 font-bold">Company</th>
              <th className="px-4 py-5 font-bold">Elo</th>
              <th className="px-4 py-5 font-bold">Wins</th>
              <th className="px-4 py-5 font-bold">Matches</th>
              <th className="py-5 pl-4 font-bold">Win Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {companies.map((company, index) => {
              const winRate = calculateWinRate(
                company.votes_won,
                company.total_matches,
              );
              return (
                <tr
                  key={company.id}
                  className="bg-white text-neutral-500 transition-colors hover:bg-neutral-50/70"
                >
                  <td className="py-6 pl-3 pr-4 text-lg font-normal text-black">
                    #{rankOffset + index + 1}
                  </td>
                  <td className="py-6 pl-8 pr-4">
                    <div className="flex min-w-48 items-center gap-3">
                      <CompanyLogo
                        name={company.name}
                        domain={company.logo_domain ?? company.domain}
                        background={company.logo_background}
                        className="size-9 shrink-0 object-contain"
                        fallbackClassName="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-normal"
                      />
                      <span className="text-xl font-normal tracking-[-0.025em] text-black">
                        {company.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-6 font-medium text-black">
                    {company.rating}
                  </td>
                  <td className="px-4 py-6">{company.votes_won}</td>
                  <td className="px-4 py-6">
                    {company.total_matches}
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
    </div>
  );
}
