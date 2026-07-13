import { CompanyLogo } from "@/components/CompanyLogo";
import type { Company } from "@/types/company";
import { calculateWinRate } from "@/utils/stats";

interface LeaderboardTableProps {
  companies: Company[];
}

export function LeaderboardTable({ companies }: LeaderboardTableProps) {
  if (companies.length === 0) {
    return (
      <section className="rounded-lg border border-gray-300 bg-white px-6 py-8 text-center">
        <h2 className="text-2xl font-medium text-black">No companies yet</h2>
        <p className="mt-3 text-sm leading-6 text-black">
          Seed the Supabase database to start the leaderboard.
        </p>
      </section>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-black bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="border-b border-black bg-white text-xs uppercase text-black">
            <tr>
              <th className="w-20 px-4 py-4 font-medium">Rank</th>
              <th className="px-4 py-4 font-medium">Company</th>
              <th className="px-4 py-4 font-medium">Elo</th>
              <th className="px-4 py-4 font-medium">Wins</th>
              <th className="px-4 py-4 font-medium">Matches</th>
              <th className="px-4 py-4 font-medium">Win rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map((company, index) => {
              const winRate = calculateWinRate(
                company.votes_won,
                company.total_matches,
              );
              return (
                <tr key={company.id} className="bg-white text-black hover:bg-gray-50">
                  <td className="px-4 py-4 text-lg font-medium">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-48 items-center gap-3">
                      <CompanyLogo
                        name={company.name}
                        logoUrl={company.logo_url}
                        className="size-8 shrink-0 object-contain"
                        fallbackClassName="flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-medium"
                      />
                      <span className="font-medium">{company.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono">
                    {company.rating}
                  </td>
                  <td className="px-4 py-4">{company.votes_won}</td>
                  <td className="px-4 py-4">
                    {company.total_matches}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-normal text-black">
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
