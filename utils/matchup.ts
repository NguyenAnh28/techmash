import type { Company, Matchup } from "@/types/company";

export function selectRandomMatchup(
  companies: Company[],
  random: () => number = Math.random,
): Matchup | null {
  if (companies.length < 2) {
    return null;
  }

  const idx1 = Math.floor(random() * companies.length);
  let idx2 = Math.floor(random() * companies.length);

  while (idx1 === idx2) {
    idx2 = Math.floor(random() * companies.length);
  }

  return {
    companyA: companies[idx1],
    companyB: companies[idx2],
  };
}
