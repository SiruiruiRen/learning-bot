# Stage 2 — Deployment Checklist

Stage 2 ships the dual-write WAL safety net across the real student flow. Before
letting real participants hit the updated code, walk through this checklist.

---

## Pre-flight (do these BEFORE merging to `main`)

### 1. Confirm migration 008 is in production Supabase

Production project: `moowjbwvntdsrrgxbtal`. Open SQL Editor and run:

```sql
SELECT COUNT(*) FROM write_ahead_log;
```

- ✅ Returns `0` or a number → table exists, Stage 1 migration applied.
- ❌ `relation "write_ahead_log" does not exist` → run
  `database/migrations/008_write_ahead_log.sql` in the SQL Editor first.

### 2. Confirm env vars on Render

In Render dashboard for `sol2lbot-frontend`
(URL: `https://solbot-frontend-7m8l.onrender.com`), Settings → Environment,
verify these EXACT values:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://moowjbwvntdsrrgxbtal.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your pro project's publishable key)
- `SUPABASE_URL` = same as `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` = same project's secret key
- `BACKEND_URL` = `https://solbot-backend.onrender.com`
- `NEXT_PUBLIC_BACKEND_URL` = `https://solbot-backend.onrender.com`

If any of these still point to the DEAD project `xuscdqhwztntycrtrdbl`, fix
them before deploying — otherwise students' WAL writes will land in a paused
project.

### 3. Typecheck / build locally

```bash
npm run build
```

Stage 2 added zero new TS errors; the build should complete exactly as it
does on `main` (modulo the pre-existing framer-motion + Supabase-builder
warnings that aren't new).

### 4. Run Playwright persona suite

```bash
npm run dev &           # on port 3004
npx playwright test tests/data-layer/
```

Expected: `4 passed, 1 skipped` (P3 is `test.fixme`, known dev-mode reload
issue — see Stage 1.1 commit message).

If P2 / P4 / P5 flake, that's the dev-mode-compile issue; rerun once.

### 5. Run Stage 2 smoke test

```bash
npx playwright test tests/data-layer/stage2-instrument.spec.ts
```

This verifies the real `navigation-tracker.tsx` fires `captureToWAL` on a
live route. Expected: `2 passed`.

---

## Deploy

### 6. Merge branch

```bash
git checkout main
git merge stage-1-datalayer    # or open a PR and squash-merge
git push origin main
```

Render will auto-deploy on push (per your existing setup).

### 7. Watch the first deploy

In Render dashboard, watch the deploy finish. If the build fails:
- Check TS errors (shouldn't be new)
- Check if `lib/dataLayerInstrument.ts` was included
- Check node version (Stage 2 needs Node 18+)

### 8. Production smoke test

Open an incognito window → `https://solbot-frontend-7m8l.onrender.com`

1. Go through onboarding (any test email like `deploy-test@example.invalid`).
2. Finish at least Phase 1 (video + chat + submission).
3. Open DevTools → Application → Local Storage → look for
   `sol2l_wal_queue_v1:<your-user-id>`. Should exist and periodically empty
   (indicating sync).
4. In Supabase SQL Editor:
   ```sql
   SELECT target_table, COUNT(*)
   FROM   write_ahead_log
   WHERE  payload->>'email' = 'deploy-test@example.invalid'
   GROUP  BY target_table;
   ```
   Should show `sessions` (1-2 rows) + `messages` (2+) + `navigation_events`
   (several) + `click_events` (several).

If any of those counts are 0, something is wrong — roll back.

### 9. Visual confirmation: sync indicator

While going through the smoke test in step 8, occasionally you should see the
bottom-right badge briefly flash `⏳ Saving N items…` then disappear. If you
never see it, the indicator isn't mounting — but the WAL should still be
capturing, so this is cosmetic only.

---

## After deploy — real-participant sanity

### 10. First real student

When the first real student runs through, open the researcher SQL:
```bash
cat database/research_data_completeness.sql
```
Paste into Supabase SQL Editor and run. The first real participant should
show up with `status = COMPLETE` (or at least `PARTIAL_PHASES` if they
stopped early — which is a participant decision, not a data-layer failure).

### 11. Watch for `status = NO_SESSION`

If any participants show `NO_SESSION`, they got in without onboarding (used
the fallback session path). This is research-valid (they might have
navigated directly to a phase URL), but should be a small minority.

### 12. Watch the `:failed` localStorage archive

There's no server-side visibility into per-browser `:failed` archives yet
(Stage 3 could add a "report archived records on next sync" feature). If you
do a pilot run, consider asking pilot participants to run this in DevTools
console at the end:

```js
Object.keys(localStorage)
  .filter(k => k.includes('sol2l_wal_queue_v1') && k.endsWith(':failed'))
  .map(k => [k, JSON.parse(localStorage.getItem(k) ?? '[]').length])
```

If any returned values are > 0, their browser has records that failed all 20
retries. Harvest them manually before clearing.

---

## Rollback plan

If Stage 2 causes issues in production:

1. Revert the branch:
   ```bash
   git revert <merge-commit-sha>
   git push origin main
   ```
2. This rolls back:
   - `captureToWAL` calls (no-op removal — existing fetches still work)
   - SyncStatusIndicator (visual element removed)
   - Route-group for `/dev/` (zero impact on non-/dev routes)
3. Existing analytics tables continue working exactly as before.
4. `write_ahead_log` rows captured during Stage 2 are preserved in Supabase
   (not deleted on rollback) — they remain queryable for reconciliation.

**The dual-write design means rollback is zero-data-loss by construction.**

---

## What Stage 2 does NOT do (future stages)

- **Server-side replay**: we still write to 23 specialised tables AND the
  WAL. Stage 3 would add a replay job that lets us delete the specialised
  writes once WAL is trusted.
- **RLS on `write_ahead_log`**: currently unrestricted like the other
  tables. Stage 3 should add a policy restricting INSERT to
  `participant_id = auth.uid()` (or similar).
- **Failed-archive visibility**: only checkable via DevTools today.
- **Cross-tab queue dedup**: two tabs by the same participant will both
  enqueue; idempotency_keys mean no Supabase duplicates, but UI counts
  may briefly be wrong.
