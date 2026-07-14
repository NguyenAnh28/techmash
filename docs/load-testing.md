# Load Testing

## Purpose

The leaderboard was changed from direct per-request database sorting to a cached 5-minute global-window snapshot. The load test checks how much that reduces latency under concurrent leaderboard traffic.

The test targets:

```txt
/leaderboard?page=1
```

## Script

The script lives at:

```txt
scripts/load-leaderboard.mjs
```

Run it through npm:

```bash
npm run load:leaderboard -- --url=http://localhost:3100 --duration=6 --warmup=5 --concurrency=50,100,250,500,1000 --label=my-run --out=load-results/my-run.json
```

Inputs:

- `--url`: base URL for the app.
- `--path`: target path, default `/leaderboard?page=1`.
- `--duration`: seconds per concurrency level.
- `--concurrency`: comma-separated concurrency levels.
- `--warmup`: warmup request count before measurements.
- `--label`: label stored in the output JSON.
- `--out`: optional JSON output path.

Metrics:

- Total requests.
- Successful requests.
- Requests per second.
- p50, p95, p99, and max latency.
- Non-2xx responses.
- Request errors.

## Local Test Environment

These results were collected against a local production Next.js server:

```bash
npm run build
PORT=3100 npm run start
```

The cached test was warmed once before measurement:

```bash
node -e "fetch('http://localhost:3100/leaderboard?page=1').then(r => r.arrayBuffer())"
```

Each concurrency level ran for 6 seconds. This is intentionally short so the full 50 to 1000 ladder can run locally without becoming painful.

## Results

| Concurrency | Direct RPS | Cached RPS | Direct p50 | Cached p50 | Direct p95 | Cached p95 | Errors |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 50 | 19.11 | 341.35 | 2272.91 ms | 140.55 ms | 3697.57 ms | 185.81 ms | 0 / 0 |
| 100 | 21.26 | 417.51 | 3904.93 ms | 230.61 ms | 7052.12 ms | 275.20 ms | 0 / 0 |
| 250 | 21.27 | 443.67 | 8985.70 ms | 513.67 ms | 11494.74 ms | 594.20 ms | 0 / 0 |
| 500 | 21.91 | 463.86 | 17114.16 ms | 746.48 ms | 22526.79 ms | 4040.55 ms | 0 / 0 |
| 1000 | 21.87 | 394.33 | 31900.74 ms | 1217.16 ms | 44641.17 ms | 6154.12 ms | 0 / 225 |

The cached implementation handled roughly 18x to 21x more requests per second in this local test. Median latency dropped by about 94 percent to 96 percent across the tested concurrency range.

The 1000-concurrency cached run produced local request errors. Those are useful to note, but they happened while the cached version still completed far more successful requests than the direct baseline. A staging test is the better place to validate the 1000-concurrency ceiling more realistically.

## Raw Results

Raw JSON outputs are stored in:

```txt
load-results/baseline-direct-leaderboard.json
load-results/cached-leaderboard-snapshot.json
```
