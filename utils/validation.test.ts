import { describe, expect, it } from "vitest";
import { validateVoteIds } from "@/utils/validation";

describe("validateVoteIds", () => {
  it("rejects missing IDs", () => {
    expect(validateVoteIds("", "company-b")).toBe("Both company IDs are required.");
    expect(validateVoteIds("company-a", "")).toBe("Both company IDs are required.");
  });

  it("rejects a self-match", () => {
    expect(validateVoteIds("company-a", "company-a")).toBe(
      "A company cannot compete against itself.",
    );
  });

  it("accepts two distinct IDs", () => {
    expect(validateVoteIds("company-a", "company-b")).toBeNull();
  });
});
