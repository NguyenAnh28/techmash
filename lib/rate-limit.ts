import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const VOTE_LIMIT = 40;
const VOTE_WINDOW = "60 s";
const RATE_LIMIT_MESSAGE =
  "You're voting fast. Give it a few seconds and try again.";

interface VoteRateLimitResult {
  ok: boolean;
  error?: string;
}

let cachedVoteLimiter: Ratelimit | null = null;

function hasUpstashConfig() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getVoteLimiter() {
  if (!hasUpstashConfig()) {
    return null;
  }

  cachedVoteLimiter ??= new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(VOTE_LIMIT, VOTE_WINDOW),
    prefix: "internmash:vote",
  });

  return cachedVoteLimiter;
}

export async function enforceVoteRateLimit(
  identifier: string,
): Promise<VoteRateLimitResult> {
  const limiter = getVoteLimiter();

  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        error: "Vote rate limiting is not configured.",
      };
    }

    return { ok: true };
  }

  try {
    const result = await limiter.limit(identifier);

    if (!result.success) {
      return {
        ok: false,
        error: RATE_LIMIT_MESSAGE,
      };
    }

    return { ok: true };
  } catch {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        error: "Could not verify vote rate limits. Please try again.",
      };
    }

    return { ok: true };
  }
}
