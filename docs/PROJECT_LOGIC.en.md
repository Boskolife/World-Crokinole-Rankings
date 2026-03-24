# World Crokinole Rankings — Project logic (English)

## 1. Purpose and stack

The app is a **Next.js 16** web application (App Router, React 19) for crokinole **events**, **player profiles**, **clubs**, and **world rankings**. Data lives in **Supabase** (PostgreSQL + Auth + Storage). **Stripe** handles paid event registration and membership checkout; webhooks update subscription state.

Internationalization uses **next-intl** under `app/[locale]/`.

---

## 2. High-level architecture

| Layer | Role |
|--------|------|
| `app/` | Routes, API route handlers, layouts |
| `src/_pages/` | Page-level compositions (server/client split where needed) |
| `src/widgets/`, `src/shared/modules/` | UI sections and reusable blocks |
| `src/shared/supabase/data.ts` | Server/client data access (queries, mutations) |
| `supabase/migrations/` | Schema, RLS, SQL functions (e.g. `refresh_rankings`) |

Authenticated flows use Supabase session cookies (`createClient` from server). Sensitive writes (match results, claims) use a **service role** client on the server only.

---

## 3. Routing behavior

### 3.1 `/{locale}` (root of locale)

Client page: if **logged in** → redirect to `/{locale}/dashboard`; if **guest** → redirect to new-visitor onboarding step 1.

### 3.2 `/{locale}/dashboard`

Re-exports the same **Home** page module as the marketing-style home: Hero, stats preview, news, rankings preview, events, clubs, subscription CTA. So “dashboard” here is the **main hub for signed-in users**, not a separate layout.

### 3.3 Public / semi-public pages (with footer)

- **`/rankings`** — Full rankings UI (same data as home preview, usually expanded).
- **`/events`** — Event listing and filters.
- **`/events/create`** — Simple event creation (`CreateEventForm`). Enforces **free plan** rules when `subscription_plan` is missing or `standard`.
- **`/events/create-tournament`** — Multi-step tournament creation; can set **ranked** vs unranked, **draft** visibility, capacity, etc.
- **`/events/[id]`** — Event detail: registration, heats, bracket (if tournament), related events.
- **`/events/[id]/edit`** — Organizer edits (authorized in UI/API as applicable).
- **`/events/[id]/results`** — **Only event creator**, signed in: enter bracket / match results (`EnterEventResultsForm` → API).
- **`/players`** — Paginated directory with search, kingdom, club filters (`getPlayersWithFilters`).
- **`/players/[id]`** — Public player profile: ratings chart, match list from `singles`/`doubles`, badges, static “Top 8 tournaments” table from `tournaments` table.
- **`/clubs`**, **`/clubs/[id]`** — Club list and club detail (members, join requests, etc.).
- **`/profile`** — Account area: subscription widget, **legacy** `tournaments` list from DB, rating/match badges, created events, my clubs.
- **`/profile/edit`** — Profile editing.
- **`/membership-plans`** — Plans / Stripe checkout entry points.
- **`/news/[id]`** — News detail page (title, date, image, rich-text description), returns `404` for invalid id or missing row.

### 3.4 Auth and onboarding (often no footer)

- **`/auth/sign-in`**, **`/sign-up`**, **`/forgot-password`**, **`/reset-password`**
- **`/new-visitor/step-1` … `step-5`**, **`save-continue`** — Guided onboarding.
- **`/claim-history`** — Flow to associate historical `match_history` rows with the user (search/filter via `getMatchHistoryForClaim`).

### 3.5 Admin

- **`/{locale}/admin/sign-in`** — Admin login gate.
- **`/{locale}/admin`** — Client admin console: sections for events, players, clubs, tournaments, rankings, match history, news, profiles, subscriptions (data edited via Supabase from the browser for authorized admins).
- Access to `/{locale}/admin*` is controlled only by **`profiles.is_admin`**. There is no separate `superadmin` role in the current code.
- Authorization is enforced in both UI (`useUserProfile`) and admin API routes (`/api/admin/schema`, `/api/admin/table`): without `is_admin=true`, requests return `403 Forbidden`.
- Grant/revoke access in Supabase SQL (example):
  - `update profiles set is_admin = true where id = '<auth_user_uuid>';`
  - revoke: `update profiles set is_admin = false where id = '<auth_user_uuid>';`
- After changing the flag, the user should sign in again (or refresh) so client-side auth/profile state is updated.
- **News / What's New** management:
  - appears as the `news` section in the admin table list;
  - create/edit uses dedicated pages `/{locale}/admin/news/new` and `/{locale}/admin/news/{id}/edit`;
  - supported fields: `image`, `title`, rich-text `description`, `link_text`, `sort_order`, `created_at`;
  - image upload goes to Supabase Storage bucket `news-images`, DB stores the public URL.

---

## 4. Core domain entities (conceptual)

- **`players`** — Player row; may link to **`user_id`** (Supabase auth). Stores display fields, **`rating`**, optional **`singles_rating`**, **`doubles_rating`**, win counts / win percentages when columns exist.
- **`events`** — Scheduled activities: format (e.g. tournament), **`is_ranked`**, dates, location, **`tournament_bracket_results`** (JSON map for UI), **`qualifying_heats`**, **`created_by`**, visibility (e.g. draft), fees, capacity.
- **`event_registrations`** — Who registered for which event (and payment fields as implemented).
- **`singles`** / **`doubles`** — **Ranked** match records from tournaments: players, winner, Elo fields (`p*_rating_old`, `p*_rating_change`, `p*_rating_new`), `event_id`, `bracket_match_key`, `match_detail` JSON.
- **`rankings`** — **Materialized** leaderboard rows per category (`laurels`, `singles`, `doubles`), filled by SQL function `refresh_rankings()`.
- **`match_history`** — Separate table used for **claim** UI and legacy/historical rows (not the same as live `singles`/`doubles` feeds for charts).
- **`news`**, **`clubs`**, **`tournaments`** (profile widget), **`profiles`** (user subscription / app profile) — Supporting tables.

---

## 5. Elo rating for tournament matches

Implemented in **`app/api/tournament-match-result/route.ts`**.

### 5.1 Formula (singles)

- Constant **K = 32**.
- Expected score for player 1: \( E_1 = 1 / (1 + 10^{(R_2 - R_1)/400}) \).
- Actual score from **set counts**: win → 1, loss → 0, tie → 0.5.
- Delta for player 1: \( \Delta_1 = K \cdot (S_1 - E_1) \), rounded to **two decimals**; player 2 gets **negative** of that (rounded).
- Baseline rating if missing: **1500** (`singles_rating` or `rating` on `players`).

### 5.2 Doubles

- Team 1 average = mean of the two team 1 players’ **doubles** ratings (fallback to `rating`).
- Team 2 average = same for team 2.
- One Elo step between the two averages; **both players on a team receive the same delta** as their team’s average would.

### 5.3 When rankings are updated

- Only if **`events.is_ranked`** is true for that event.
- Otherwise the handler only updates **`tournament_bracket_results`** (bracket progression) with no `singles`/`doubles` rows and no Elo.

### 5.4 Editing / idempotency

- Matches are keyed by **`event_id` + `bracket_match_key`**. If a row exists, the API **reverts** previous rating deltas on `players` before applying new ones, then **updates** the row; else **inserts**.
- After DB changes: **`recomputePlayerAggregatesFromMatches`** for all affected player row IDs, then **`refresh_rankings`** RPC (best effort; failure can be returned as `rankingsRefreshFailed` in JSON).

### 5.5 Authorization

- Only **`events.created_by`** (the signed-in user) may POST match results.

### 5.6 Match date

- Uses event **`start_date`** (date part) when present; otherwise **today** (UTC date).

---

## 6. Player aggregates (`recompute-player-aggregates-from-matches.ts`)

For each affected **`players.id`**:

- Loads all **`singles`** and **`doubles`** rows involving that id, ordered by date.
- **Wins / losses / ties** derived from `winner` and side (P1/P2 or T1/T2).
- **Last singles rating** = latest `p*_rating_new` from singles; **last doubles** from doubles.
- Updates **`singles_won`**, **`singles_played`**, **`doubles_*`**, **`total_*`**, formatted win percentages, and **`rating`** / **`combined_rating`**:
  - If both disciplines exist: `combined_rating` and `rating` = rounded average of last singles and doubles.
  - Else `rating` follows whichever discipline exists.

If DB lacks win_pct / combined columns, the updater retries without those fields.

---

## 7. Rankings table and `refresh_rankings()` (SQL)

Defined in **`supabase/migrations/20250309120000_create_rankings_table.sql`**. On each run it **truncates and rebuilds** `rankings`.

### 7.1 Laurels (per player)

- For each **calendar day** in the last **24 months**, sum **rating_change** across all singles + doubles appearances for that player → `day_score`.
- Take the **top 8** days by `day_score` per player (`ROW_NUMBER … ORDER BY day_score DESC`).
- Weight: **1.0** if the day falls in the **most recent 12 months** (`match_date >= cutoff_12m`), else **0.75** (still within the 24‑month window).
- **Laurels** = round(sum of `day_score * weight` over those up-to-8 days).

### 7.2 Singles category rows

- From all **`singles`** rows: per player, current **rating** = rating after **latest** match; aggregate **wins / losses / ties**.
- **Rank** = `ROW_NUMBER` ordered by rating descending.
- **Trend** = difference between current rating and rating as of **90 days ago** (from last match on/before that cutoff); formatted as `+x.xx`, negative, or `—`.

### 7.3 Doubles category rows

- Same pattern as singles but from **`doubles`** (each of four player slots contributes rows for aggregation).

### 7.4 Laurels category rows (leaderboard type `laurels`)

- Ranks **`players`** by **`players.rating`** (combined profile rating), not by the laurels sum directly for ordering — **laurels** column still shows the computed laurels score; **trend** uses combined rating vs 90d ago from merged singles+doubles history.

Public read policy: rankings are **SELECT**-able by everyone (RLS).

---

## 8. Rating history charts (`getRatingHistoryFromSinglesDoubles`)

- Window: last **24 months** of matches.
- Builds a time series from **`p*_rating_change`** in order; **initial** rating taken from first match’s `rating_old` or derived from `rating_new - change`.
- Produces monthly comparison points (this year vs last year) and a **change** string vs start of window.
- Used on **player profile** and related widgets.

On profile load, **`updatePlayerRatingsFromMatches`** may sync `players` ratings from these computed end values (fire-and-forget).

---

## 9. Events and tournaments (UI logic)

- **Draft tournaments**: non-creators get **404** on event detail (hidden).
- **Qualifying heats**: if configured, registrations can be split per heat; after event end, heat results can be loaded for display.
- **`getGamesPlayedCount`** on event detail: for doubles-like formats, uses **pairs − 1**; for singles, **participants − 1** — used for participation / workload hints.
- **Bracket**: results map stored in **`events.tournament_bracket_results`**; winner advancement applied in **`tournament-bracket-winner-advance`**.

---

## 10. Subscriptions and plans

- **`profiles.subscription_plan`**: e.g. `standard` (treated as free), `premium`, `administrator`.
- **Free (`standard` / empty)**: **`CreateEventForm`** forces **unranked** events, **fee 0**, and **at most one active** event per user (`getActiveEventsCountByUser`).
- **Premium / administrator**: can create **ranked** events and normal fees; hero CTA shows create event/tournament.
- **Stripe**: checkout and webhook routes update payment/subscription-related state (see `app/api/stripe/*`).

---

## 11. Player claiming

**`POST /api/claim-player`**: authenticated user links a **`players`** row to their **`user_id`**, removes duplicate auto-created row for same user if needed, clears `is_auto_created`. Used so a real account “owns” an imported profile.

---

## 12. Notable API routes (summary)

| Route | Role |
|--------|------|
| `tournament-match-result` | Elo + singles/doubles persistence + bracket map + aggregates + `refresh_rankings` |
| `claim-player` | Attach `user_id` to existing player |
| `ensure-player` | Ensure player row exists for user |
| `tournament-bracket-singles` (and related) | Bracket structure helpers |
| `stripe/checkout`, `webhook`, `confirm-event-registration` | Payments |

---

## 13. Data flow cheat sheet

1. Organizer creates **ranked** tournament → users register → organizer enters results → **`singles`/`doubles`** updated, **`players`** stats/ratings recomputed → **`refresh_rankings()`** refreshes **`rankings`** → home/rankings UI reads **`rankings`** via **`getRankings` / `getAllRankings`**.
2. **Laurels** on those pages come from the SQL laurels algorithm, not from a separate client calculation.
3. **Profile “Top 8 tournaments”** is **`tournaments`** table content, not derived from live Elo tables in code shown here.

4. **What’s New** on home/dashboard:
   - data comes from `news` via `getNews()`;
   - ordering is `sort_order` ascending, then `created_at` descending;
   - client-side pagination shows 3 cards per page (`NewsClient` + `Pagination`);
   - if a page has fewer than 3 cards, placeholder cards keep the grid shape stable;
   - card click opens `/news/{id}`, which loads data via `getNewsById()`.

---

*This document describes behavior inferred from the repository as of the documented revision; production Supabase policies and triggers may add further rules.*
