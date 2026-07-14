export function getVoteDatabaseErrorMessage(error: {
  code?: string;
  message?: string;
}) {
  const message = error.message?.toLowerCase() ?? "";

  if (
    error.code === "55P03" ||
    message.includes("lock timeout") ||
    message.includes("could not obtain lock")
  ) {
    return "This matchup is busy. Please try again.";
  }

  if (error.code === "57014" || message.includes("statement timeout")) {
    return "This matchup took too long. Please try again.";
  }

  return "Could not record this vote.";
}
