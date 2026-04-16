# Stage 1 — Offline-first DataLayer

Stage 1 adds an **isolated, additive** write-ahead-log layer so we can prove the
offline-first design end-to-end before touching any of the 40+ existing fetch
call sites. Nothing in this stage modifies the student flow, the current API
routes, or any existing Supabase table.

This doc is a run-book. If you're just here to press buttons, jump to
[Quick start](#quick-start).

---

## What landed in Stage 1

| Artifact | Purpose |
|----------|---------|
| `database/migrations/008_write_ahead_log.sql` | New table `write_ahead_log`. Additive; safe to re-run. |
| `lib/supabaseBrowserClient.ts` | Singleton browser-side Supabase client using the existing `NEXT_PUBLIC_*` env vars. Used **only** by the DataLayer. |
| `lib/dataLayer.ts` | The core class: `record()`, `sync()`, `dispose()`. WAL to localStorage, background sync, exponential backoff, idempotency, beforeunload guard. |
| `app/dev/data-layer-test/page.tsx` | Dev-only harness at `/dev/data-layer-test`. Not linked from the student flow. |
| `tests/data-layer/personas.spec.ts` | Five Playwright personas that exercise the DataLayer. |
| `playwright.config.ts` | Scoped to `tests/data-layer/` only. |
| `database/verify_data_layer.sql` | Paste participant ids from the Playwright report; runs structural checks and row-count assertions. |

### What Stage 1 did NOT touch
- No existing fetch call site
- No existing API route (`app/api/**`)
- No Python backend
- No existing Supabase table
- No `.env.local` variables

---

## Quick start

Assumes `cd /Users/sirui/Desktop/sol2l-bot` and you are on the `stage-1-datalayer`
branch.

### 1. Apply the migration (one-time)

Open the Supabase SQL Editor for project `moowjbwvntdsrrgxbtal`, paste the
contents of `database/migrations/008_write_ahead_log.sql`, and hit **Run**.
It uses `CREATE TABLE IF NOT EXISTS`, so re-running is harmless.

Verify:

```sql
SELECT COUNT(*) FROM write_ahead_log;   -- should return 0
```

### 2. Start the dev server

```bash
npm run dev
```

The app listens on **port 3004** (see `package.json`).

### 3. Manual exploration (optional but recommended first)

Open `http://localhost:3004/dev/data-layer-test`. You'll see:

- A generated **participant id** (unique per tab).
- A **sync indicator** — "✓ All saved" or "⏳ N pending".
- Five **persona buttons** (P1–P5) that run the same scenarios as the
  Playwright suite.
- A **Force offline** toggle that swaps in a null Supabase client, so you can
  queue up events without them draining.
- A live **queue table** showing pending records, attempt counts, and last
  error.
- An **activity log**.

Try:

1. Click **P1 · Fast completer**. The queue fills up and empties within ~2s.
2. Toggle **Force offline**, then click **P4 · Offline interlude**. Watch the
   queue stall at 5. Reload the tab — queue survives. Toggle offline back off
   and hit **Drain now**. Queue empties.
3. Open DevTools → Application → Local Storage → your origin. You'll see the
   key `sol2l_wal_queue_v1:<participant-id>`.

### 4. Automated persona suite

```bash
npx playwright test tests/data-layer/
```

The config assumes `npm run dev` is already running on 3004. Five tests run
sequentially. Each test:

- Sets a fresh participant id via `localStorage` before navigation.
- Runs its persona.
- Waits for `data-pending-count="0"`.
- Asserts localStorage is clean (no leftover queue, no archived failures).

Output includes a per-test annotation with the participant id. The HTML
report is written to `playwright-report/`. Open it:

```bash
npx playwright show-report
```

### 5. Verify the Supabase side

1. Copy the five participant ids from the HTML report (Annotations tab →
   "participant").
2. Open `database/verify_data_layer.sql` and paste them into the two
   `VALUES (...)` blocks (there are comments showing exactly where).
3. Paste the whole script into the Supabase SQL Editor and run.

The script answers:

- Does the table exist with the right UNIQUE constraint? (Section 0)
- How many rows per participant, any duplicates? (Section 1)
- Does each persona meet its expected minimum row count? (Section 2)
- Are there any duplicate idempotency_keys globally? (Section 3)
- Any clock-skew anomalies? (Section 4)
- A recent-activity feed for eyeballing. (Section 5)
- Cleanup helper (commented out). (Section 6)

Expected results for a healthy run:

| Section | Expected |
|---------|----------|
| 0 | Both checks `pass = true` |
| 1 | `no_duplicates = true` for every participant |
| 2 | `pass = true` for every persona row |
| 3 | Zero rows returned |
| 4 | Zero rows returned (unless your test machine's clock is off) |

---

## Design notes

### Why a single generic `write_ahead_log` table?

Because Stage 1 is a proof of concept, not a schema migration. By keeping the
payload in JSONB we avoid committing to a final shape before we've validated
the sync mechanics. Stage 2 will:

- Pick a small number of real tables to migrate (probably `messages`,
  `assessments`, and `content_interaction_logs` first).
- Add `idempotency_key` + `client_timestamp` columns to those tables.
- Introduce a server-side replay job (or a DB trigger) that projects WAL rows
  into the real tables.

### Why crypto.randomUUID() on the client?

The WAL table has `UNIQUE(idempotency_key)`. If the network retries, the
client sends the same UUID, Postgres returns a `23505` unique_violation, and
the DataLayer treats that as "already persisted" and drops the row from the
local queue. This is the cornerstone of retry-safety.

### Why `NEXT_PUBLIC_SUPABASE_ANON_KEY` directly from the browser?

The existing codebase routes every write through a Next.js API route that uses
the service-role key. That works, but it makes the API route an additional
failure point. The offline-first design wants the failure surface as small as
possible: browser → Supabase, nothing in between. It works today because RLS
is disabled on the project; Stage 2 should add an RLS policy that only permits
INSERT on `write_ahead_log` rows whose `participant_id` matches a known
session.

### Why "just archive and drop" after `maxAttempts`?

If a single malformed record were allowed to block the queue forever, a bug
that corrupted one event could prevent every subsequent event from syncing.
After 20 attempts (covering ~2 minutes with exponential backoff), the DataLayer
moves the record to a local `:failed` key and continues. An operator can
inspect `localStorage.getItem("sol2l_wal_queue_v1:<pid>:failed")` in DevTools.

### Why no `beforeunload` prompt in the test harness?

Playwright treats the native browser prompt as a failure. The harness passes
`suppressBeforeUnload: true`. Production callers should leave it at the
default so students get a warning if they try to close with unsent data.

---

## Troubleshooting

**"DataLayer will stay in local-only mode"** warning in the browser console  
Your `.env.local` is missing `NEXT_PUBLIC_SUPABASE_URL` or
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Confirm with `grep -E 'NEXT_PUBLIC_SUPABASE' .env.local`.

**Playwright can't reach the page**  
Make sure `npm run dev` is live on port 3004 before running the test. Override
with `STAGE1_BASE_URL=http://localhost:1234 npx playwright test ...` if your
dev server runs elsewhere.

**`23505` errors spam the console during testing**  
That's the retry path doing its job. It means an insert succeeded on the
server but the response never got back to the client, so the client tried
again with the same `idempotency_key`. The DataLayer treats that as success.

**Verify-SQL section 2 shows `pass = false`**  
The persona ran but some events didn't land. Check the Playwright trace for
that run (`playwright-report/`) and inspect localStorage in the preserved
trace. Common cause: the test environment has localStorage quota issues
(rare, but possible in incognito contexts).

---

## Next steps (Stage 2 preview)

When you approve Stage 1:

1. Pick the first high-risk write path to migrate. My recommendation is the
   chat turn (`POST /api/chat` → `messages` + `assessments`) because:
   - It's the single most research-critical path.
   - It's one logical operation today (one endpoint), so migrating it is a
     self-contained unit.
   - It's where a failure currently produces silent data loss with no
     localStorage recovery.

2. Add `idempotency_key UUID UNIQUE` and `client_timestamp TIMESTAMPTZ` to
   `messages` and `assessments`.

3. Rewire `components/solbot-chat.tsx` to go through the DataLayer instead of
   calling `fetch('/api/chat')` directly.

4. Add a server-side endpoint `POST /api/wal/drain` (or a Supabase edge
   function) that replays WAL rows into the target tables.

5. Mirror the Stage 1 Playwright pattern: add one persona per migrated path.
