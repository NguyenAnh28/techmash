export interface EloResult {
  newRatingWinner: number;
  newRatingLoser: number;
}

export function calculateElo(
  winnerRating: number,
  loserRating: number,
  K = 32,
): EloResult {
  const expectedWinner =
    1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));

  const expectedLoser =
    1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  return {
    newRatingWinner: Math.round(winnerRating + K * (1 - expectedWinner)),
    newRatingLoser: Math.round(loserRating + K * (0 - expectedLoser)),
  };
}
