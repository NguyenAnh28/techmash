import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const MAX_BODY_BYTES = 8192;
const MAX_EVENT_TYPE_LENGTH = 64;
const MAX_PATH_LENGTH = 512;
const MAX_SESSION_ID_LENGTH = 128;

const ALLOWED_EVENT_TYPES = new Set([
  "page_view",
  "matchup_view",
  "vote_cast",
  "logo_error",
]);

interface AnalyticsPayload {
  event_type?: unknown;
  path?: unknown;
  session_id?: unknown;
  metadata?: unknown;
}

function isPlainObject(value: unknown): value is Record<string, Json> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeNullableString(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const body = await request.text();

    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Analytics event is too large." },
        { status: 413 },
      );
    }

    const payload = JSON.parse(body) as AnalyticsPayload;
    const eventType = normalizeNullableString(
      payload.event_type,
      MAX_EVENT_TYPE_LENGTH,
    );

    if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json(
        { error: "Unknown analytics event type." },
        { status: 400 },
      );
    }

    const metadata = payload.metadata ?? {};

    if (!isPlainObject(metadata)) {
      return NextResponse.json(
        { error: "Analytics metadata must be an object." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("analytics_events").insert({
      event_type: eventType,
      path: normalizeNullableString(payload.path, MAX_PATH_LENGTH),
      session_id: normalizeNullableString(
        payload.session_id,
        MAX_SESSION_ID_LENGTH,
      ),
      metadata,
    });

    if (error) {
      return NextResponse.json(
        { error: "Could not record analytics event." },
        { status: 500 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
