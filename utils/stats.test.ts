import { describe, expect, it } from "vitest";
import { calculateWinRate } from "@/utils/stats";

describe("calculateWinRate", () => {
  it("returns zero when no matches exist", () => {
    expect(calculateWinRate(0, 0)).toBe(0);
  });

  it("rounds the win rate percentage", () => {
    expect(calculateWinRate(2, 3)).toBe(67);
  });
});
