export function validateVoteIds(winnerId: string, loserId: string): string | null {
  if (!winnerId || !loserId) {
    return "Both company IDs are required.";
  }

  if (winnerId === loserId) {
    return "A company cannot compete against itself.";
  }

  return null;
}
