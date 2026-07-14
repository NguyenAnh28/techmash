"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

interface LeaderboardRefreshTimerProps {
  lastRefreshedAt: string;
  nextRefreshAt: string;
  refreshIntervalSeconds: number;
  refreshTimeZone: string;
}

function formatRemainingTime(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTimeZoneLabel(timeZone: string) {
  if (timeZone === "America/Los_Angeles") {
    return "PT";
  }

  return timeZone;
}

export function LeaderboardRefreshTimer({
  lastRefreshedAt,
  nextRefreshAt,
  refreshIntervalSeconds,
  refreshTimeZone,
}: LeaderboardRefreshTimerProps) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const nextRefreshAtMs = useMemo(
    () => new Date(nextRefreshAt).getTime(),
    [nextRefreshAt],
  );
  const remainingMs = nextRefreshAtMs - now;
  const canRefresh = remainingMs <= 0;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-2xl border border-black/[0.04] bg-white px-4 py-3 text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:text-right">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
        Snapshot
      </p>
      <p className="mt-1 text-sm font-medium text-neutral-500">
        Last updated {formatTime(lastRefreshedAt, refreshTimeZone)}{" "}
        {getTimeZoneLabel(refreshTimeZone)}
      </p>
      {canRefresh ? (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isPending}
          className="mt-2 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-neutral-200 disabled:cursor-wait disabled:text-slate-400"
        >
          {isPending ? "Refreshing" : "Refresh rankings"}
        </button>
      ) : (
        <p className="mt-2 text-lg font-normal tracking-[-0.03em] text-black">
          {formatRemainingTime(remainingMs)}
          <span className="ml-2 text-xs font-medium tracking-normal text-neutral-500">
            until refresh
          </span>
        </p>
      )}
      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-300">
        {Math.round(refreshIntervalSeconds / 60)} min cadence
      </p>
    </div>
  );
}
