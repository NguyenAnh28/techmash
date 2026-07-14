export function formatHourlyPay(hourlyPay: number | null) {
  return hourlyPay === null ? "Not listed" : `$${hourlyPay}/hr`;
}

export function formatSubmissions(numSubmits: number | null) {
  if (numSubmits === null) {
    return "No reports";
  }

  return `${numSubmits} ${numSubmits === 1 ? "report" : "reports"}`;
}

export function formatLocation(housingPerk: string | null) {
  const location = housingPerk?.trim();

  if (!location) {
    return "Location not listed";
  }

  return location.replace(/^relocation to\s+/i, "");
}
