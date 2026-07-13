import { CompanyLogo } from "@/components/CompanyLogo";
import type { Company } from "@/types/company";
import { calculateWinRate } from "@/utils/stats";

interface LeaderboardTableProps {
  companies: Company[];
}

export function LeaderboardTable({ companies }: LeaderboardTableProps) {
  if (companies.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white px-6 py-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          No companies yet
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Seed the Supabase database to start the leaderboard.
        </p>
      </section>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="w-20 px-4 py-4 font-bold">Rank</th>
              <th className="px-4 py-4 font-bold">Company</th>
              <th className="px-4 py-4 font-bold">Elo</th>
              <th className="px-4 py-4 font-bold">Wins</th>
              <th className="px-4 py-4 font-bold">Matches</th>
              <th className="px-4 py-4 font-bold">Win rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies.map((company, index) => {
              const winRate = calculateWinRate(
                company.votes_won,
                company.total_matches,
              );
              return (
                <tr
                  key={company.id}
                  className="bg-white text-slate-700 transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4 text-lg font-bold text-slate-900">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-48 items-center gap-3">
                      <CompanyLogo
                        name={company.name}
                        logoUrl={company.logo_url}
                        className="size-8 shrink-0 object-contain"
                        fallbackClassName="flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold"
                      />
                      <span className="font-bold text-slate-900">
                        {company.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {company.rating}
                  </td>
                  <td className="px-4 py-4">{company.votes_won}</td>
                  <td className="px-4 py-4">
                    {company.total_matches}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
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
