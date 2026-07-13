export function calculateWinRate(votesWon: number, totalMatches: number): number {
  if (totalMatches <= 0) {
    return 0;
  }

  return Math.round((votesWon / totalMatches) * 100);
}
