#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const DEFAULT_CONCURRENCY = [50, 100, 250, 500, 1000];
const DEFAULT_DURATION_SECONDS = 10;
const DEFAULT_PATH = "/leaderboard?page=1";
const DEFAULT_WARMUP_COUNT = 5;

function parseArgs(argv) {
  const options = {
    baseUrl: "http://localhost:3000",
    path: DEFAULT_PATH,
    durationSeconds: DEFAULT_DURATION_SECONDS,
    concurrency: DEFAULT_CONCURRENCY,
    warmupCount: DEFAULT_WARMUP_COUNT,
    label: "leaderboard-load-test",
    out: null,
  };

  for (const arg of argv) {
    const [key, value] = arg.split("=");

    if (key === "--url" && value) {
      options.baseUrl = value;
      continue;
    }

    if (key === "--path" && value) {
      options.path = value;
      continue;
    }

    if (key === "--duration" && value) {
      options.durationSeconds = Number(value);
      continue;
    }

    if (key === "--concurrency" && value) {
      options.concurrency = value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item) && item > 0);
      continue;
    }

    if (key === "--warmup" && value) {
      options.warmupCount = Number(value);
      continue;
    }

    if (key === "--label" && value) {
      options.label = value;
      continue;
    }

    if (key === "--out" && value) {
      options.out = value;
    }
  }

  if (!Number.isFinite(options.durationSeconds) || options.durationSeconds <= 0) {
    throw new Error("--duration must be a positive number of seconds.");
  }

  if (!Number.isInteger(options.warmupCount) || options.warmupCount < 0) {
    throw new Error("--warmup must be a non-negative integer.");
  }

  if (options.concurrency.length === 0) {
    throw new Error("--concurrency must include at least one positive integer.");
  }

  return options;
}

function buildTargetUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.ceil((percentileValue / 100) * values.length) - 1;
  return values[Math.min(Math.max(index, 0), values.length - 1)];
}

function summarizeLatencies(latencies, totalDurationMs, non2xx, errors) {
  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const totalRequests = latencies.length + errors;

  return {
    totalRequests,
    successfulRequests: latencies.length,
    requestsPerSecond: Number(
      (totalRequests / (totalDurationMs / 1000)).toFixed(2),
    ),
    p50Ms: Number(percentile(sortedLatencies, 50).toFixed(2)),
    p95Ms: Number(percentile(sortedLatencies, 95).toFixed(2)),
    p99Ms: Number(percentile(sortedLatencies, 99).toFixed(2)),
    maxMs: Number((sortedLatencies.at(-1) ?? 0).toFixed(2)),
    non2xx,
    errors,
  };
}

async function fetchOnce(targetUrl) {
  const startedAt = performance.now();
  const response = await fetch(targetUrl, {
    cache: "no-store",
    headers: {
      "user-agent": "internmash-leaderboard-load-test",
    },
  });

  await response.arrayBuffer();

  return {
    latencyMs: performance.now() - startedAt,
    ok: response.ok,
    status: response.status,
  };
}

async function warmup(targetUrl, count) {
  for (let index = 0; index < count; index += 1) {
    await fetchOnce(targetUrl);
  }
}

async function runScenario(targetUrl, concurrency, durationSeconds) {
  const durationMs = durationSeconds * 1000;
  const endsAt = performance.now() + durationMs;
  const latencies = [];
  let non2xx = 0;
  let errors = 0;

  async function worker() {
    while (performance.now() < endsAt) {
      try {
        const result = await fetchOnce(targetUrl);
        latencies.push(result.latencyMs);

        if (!result.ok) {
          non2xx += 1;
        }
      } catch {
        errors += 1;
      }
    }
  }

  const startedAt = performance.now();
  await Promise.all(
    Array.from({ length: concurrency }, () => worker()),
  );
  const totalDurationMs = performance.now() - startedAt;

  return {
    concurrency,
    durationSeconds,
    ...summarizeLatencies(latencies, totalDurationMs, non2xx, errors),
  };
}

async function writeResults(outPath, payload) {
  const absolutePath = resolve(outPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(payload, null, 2)}\n`);
  return absolutePath;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const targetUrl = buildTargetUrl(options.baseUrl, options.path);

  console.log(`Target: ${targetUrl}`);
  console.log(`Label: ${options.label}`);
  console.log(`Duration: ${options.durationSeconds}s`);
  console.log(`Concurrency: ${options.concurrency.join(", ")}`);
  console.log(`Warmup requests: ${options.warmupCount}`);

  await warmup(targetUrl, options.warmupCount);

  const results = [];

  for (const concurrency of options.concurrency) {
    console.log(`\nRunning concurrency ${concurrency}...`);
    const result = await runScenario(
      targetUrl,
      concurrency,
      options.durationSeconds,
    );
    results.push(result);
    console.table([result]);
  }

  const payload = {
    label: options.label,
    targetUrl,
    durationSeconds: options.durationSeconds,
    warmupCount: options.warmupCount,
    generatedAt: new Date().toISOString(),
    results,
  };

  if (options.out) {
    const writtenPath = await writeResults(options.out, payload);
    console.log(`\nWrote results to ${writtenPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
