import type { Company, Matchup } from "@/types/company";

export function createMatchupFromCompanies(companies: Company[]): Matchup | null {
  const [companyA, companyB] = companies;

  if (!companyA || !companyB || companyA.id === companyB.id) {
    return null;
  }

  return {
    companyA,
    companyB,
  };
}

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

  return createMatchupFromCompanies([companies[idx1], companies[idx2]]);
}
