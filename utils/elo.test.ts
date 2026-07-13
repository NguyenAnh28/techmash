import { describe, expect, it } from "vitest";
import { calculateElo } from "@/utils/elo";

describe("calculateElo", () => {
  it("updates equal ratings with the default K-factor", () => {
    expect(calculateElo(1200, 1200)).toEqual({
      newRatingWinner: 1216,
      newRatingLoser: 1184,
    });
  });

  it("rewards an upset more than an expected win", () => {
    const expectedWin = calculateElo(1400, 1000);
    const upset = calculateElo(1000, 1400);

    expect(upset.newRatingWinner - 1000).toBeGreaterThan(
      expectedWin.newRatingWinner - 1400,
    );
    expect(1400 - upset.newRatingLoser).toBeGreaterThan(
      1000 - expectedWin.newRatingLoser,
    );
  });
});
