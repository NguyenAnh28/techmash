import type { Metadata } from "next";
import { getErrorMessage } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AnalyticsEvent, Json } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stats | InternMash",
  description: "Live InternMash community activity and product analytics.",
};

type AnalyticsEventRow = Pick<
  AnalyticsEvent,
  "event_type" | "path" | "session_id" | "metadata" | "created_at"
>;

interface CountRow {
  label: string;
  count: number;
  helper?: string;
}

const LOOKBACK_DAYS = 30;
const EVENT_LIMIT = 5000;

function getMetadataString(metadata: Json, key: string) {
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    Array.isArray(metadata)
  ) {
    return null;
  }

  const value = metadata[key];

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function countBy<T>(
  rows: T[],
  getKey: (row: T) => string | null | undefined,
) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = getKey(row)?.trim();

    if (!key) {
      continue;
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));
}

function getEventCount(rows: AnalyticsEventRow[], eventType: string) {
  return rows.filter((row) => row.event_type === eventType).length;
}

function getPercent(numerator: number, denominator: number) {
  if (denominator === 0) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

async function getAnalyticsRows() {
  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type,path,session_id,metadata,created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(EVENT_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <section className="rounded-3xl border border-black/[0.04] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
        {label}
      </p>
      <p className="mt-4 text-4xl font-normal tracking-[-0.04em] text-black">
        {value}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-neutral-500">
        {helper}
      </p>
    </section>
  );
}

function RankedList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: CountRow[];
  empty: string;
}) {
  return (
    <section className="rounded-3xl border border-black/[0.04] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <h2 className="text-2xl font-normal tracking-[-0.035em] text-black">
        {title}
      </h2>
      {rows.length > 0 ? (
        <div className="mt-5 divide-y divide-slate-100">
          {rows.slice(0, 8).map((row, index) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-5 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-black">
                  {index + 1}. {row.label}
                </p>
                {row.helper ? (
                  <p className="mt-1 truncate text-xs font-medium text-neutral-400">
                    {row.helper}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-xl bg-neutral-100 px-3 py-1 text-xs font-bold text-black">
                {row.count}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm font-medium leading-6 text-neutral-500">
          {empty}
        </p>
      )}
    </section>
  );
}

export default async function StatsPage() {
  let rows: AnalyticsEventRow[] = [];
  let error: string | null = null;

  try {
    rows = await getAnalyticsRows();
  } catch (caughtError) {
    error = getErrorMessage(caughtError);
  }

  const pageViews = getEventCount(rows, "page_view");
  const matchupViews = getEventCount(rows, "matchup_view");
  const votes = getEventCount(rows, "vote_cast");
  const logoErrors = getEventCount(rows, "logo_error");
  const uniqueSessions = new Set(
    rows.map((row) => row.session_id).filter(Boolean),
  ).size;

  const topPages = countBy(
    rows.filter((row) => row.event_type === "page_view"),
    (row) => row.path ?? "/",
  );
  const topWinners = countBy(
    rows.filter((row) => row.event_type === "vote_cast"),
    (row) => getMetadataString(row.metadata, "winner_name"),
  );
  const logoFailures = countBy(
    rows.filter((row) => row.event_type === "logo_error"),
    (row) => getMetadataString(row.metadata, "company_name"),
  ).map((row) => {
    const matchingEvent = rows.find(
      (event) =>
        event.event_type === "logo_error" &&
        getMetadataString(event.metadata, "company_name") === row.label,
    );

    return {
      ...row,
      helper: matchingEvent
        ? getMetadataString(matchingEvent.metadata, "domain") ?? undefined
        : undefined,
    };
  });

  return (
    <main className="bg-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-5 pb-10 pt-16 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-slate-400">
            Stats
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-normal tracking-[-0.04em] text-black sm:text-6xl lg:text-7xl">
            Live community pulse.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-7 text-neutral-500">
            A public look at how students are using InternMash: votes,
            matchups, page traffic, and cleanup signals from the last{" "}
            {LOOKBACK_DAYS} days.
          </p>
        </div>
        <div className="shrink-0 border-y border-slate-200 py-4 text-left md:text-right">
          <p className="text-4xl font-normal tracking-[-0.04em] text-black">
            {rows.length}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
            Public Events
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-6">
        {error ? (
          <section className="rounded-3xl border border-rose-100 bg-white p-6 text-rose-600 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            {error}
          </section>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Page Views"
                value={pageViews}
                helper={`${uniqueSessions} anonymous sessions`}
              />
              <MetricCard
                label="Votes"
                value={votes}
                helper={`${getPercent(votes, matchupViews)} vote-through rate`}
              />
              <MetricCard
                label="Matchups"
                value={matchupViews}
                helper="Pairs shown to visitors"
              />
              <MetricCard
                label="Logo Issues"
                value={logoErrors}
                helper="Failed logo.dev lookups"
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <RankedList
                title="Top Pages"
                rows={topPages}
                empty="No page views recorded yet."
              />
              <RankedList
                title="Top Vote Winners"
                rows={topWinners}
                empty="No votes recorded yet."
              />
              <RankedList
                title="Logo Cleanup"
                rows={logoFailures}
                empty="No logo failures recorded yet."
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
