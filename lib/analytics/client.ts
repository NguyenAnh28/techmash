type AnalyticsMetadataValue = string | number | boolean | null;

export type AnalyticsEventType =
  | "page_view"
  | "matchup_view"
  | "vote_cast"
  | "logo_error";

export type AnalyticsMetadata = Record<string, AnalyticsMetadataValue>;

const SESSION_STORAGE_KEY = "internmash_session_id";

function getSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existingSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (existingSessionId) {
      return existingSessionId;
    }

    const nextSessionId = window.crypto.randomUUID();
    window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);

    return nextSessionId;
  } catch {
    return null;
  }
}

function getCurrentPath() {
  if (typeof window === "undefined") {
    return null;
  }

  return `${window.location.pathname}${window.location.search}`;
}

export function trackAnalyticsEvent(
  eventType: AnalyticsEventType,
  metadata: AnalyticsMetadata = {},
  path = getCurrentPath(),
) {
  if (typeof window === "undefined") {
    return;
  }

  const body = JSON.stringify({
    event_type: eventType,
    path,
    session_id: getSessionId(),
    metadata,
  });

  const blob = new Blob([body], { type: "application/json" });

  if (navigator.sendBeacon?.("/api/analytics", blob)) {
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics should never block the product flow.
  });
}
