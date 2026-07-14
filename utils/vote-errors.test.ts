import { describe, expect, it } from "vitest";
import { getVoteDatabaseErrorMessage } from "@/utils/vote-errors";

describe("getVoteDatabaseErrorMessage", () => {
  it("maps lock timeout errors to a busy matchup message", () => {
    expect(getVoteDatabaseErrorMessage({ code: "55P03" })).toBe(
      "This matchup is busy. Please try again.",
    );
    expect(
      getVoteDatabaseErrorMessage({
        message: "canceling statement due to lock timeout",
      }),
    ).toBe("This matchup is busy. Please try again.");
  });

  it("maps statement timeout errors to a retry message", () => {
    expect(getVoteDatabaseErrorMessage({ code: "57014" })).toBe(
      "This matchup took too long. Please try again.",
    );
  });

  it("falls back to the generic vote error", () => {
    expect(getVoteDatabaseErrorMessage({ message: "unexpected" })).toBe(
      "Could not record this vote.",
    );
  });
});
