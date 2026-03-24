# World Crokinole Rankings — User & roles guide (English)

This document describes **how people use the product**, **who can do what**, and how **events**, **tournaments**, and **clubs** differ. It is written for product and UX readers, not for implementation details.

---

## 1. Who uses the site

| Audience | Typical goals |
|----------|----------------|
| **Visitor (not signed in)** | Discover rankings, events, players, clubs; often steered into sign-up / onboarding. |
| **Player (signed in)** | Track personal stats, join events, manage profile and subscription, optionally join clubs or organize activities. |
| **Event / tournament organizer** | Create listings, manage registrations, run brackets and (for ranked tournaments) record results that affect ratings. |
| **Club owner or club admin** | Run a club page, approve members, share perks (e.g. discount codes), invite people. |
| **Site operator** | Uses the separate **Admin Panel** to manage global data (see roles below). |

---

## 2. Roles and permissions (what the app distinguishes)

The product mixes **subscription tier**, **club role**, **event ownership**, and a separate **site-admin flag**.

### 2.1 Subscription plans (`standard`, `premium`, `administrator`)

These appear in the header as the user’s plan label and drive **organizer** capabilities:

- **Standard (free)**  
  - Can **create a simple event** with strict limits: **only unranked** events, **no paid entry fee** (must be free), and **only one “active” event at a time** per account (must wait until it ends before creating another).  
  - Does **not** get the hero shortcut **“Create Ranked Tournament”** (that shortcut is for Community Administrators — see below).  
  - Can still **browse**, **register for** other people’s events/tournaments, and pay fees if those events charge money.

- **Premium**  
  - Can **create simple events** without the free-plan restrictions (ranked/unranked and pricing follow the form rules).  
  - Sees **“Create New Event”** in the events hero (when eligible).  
  - Same participation behavior as any logged-in user for joining events and clubs.

- **Administrator** (in the app this is labeled like a **Community Administrator** plan — paid tier, not the same as “site admin”)  
  - Everything Premium can do for creating events, **plus** the events hero shows **“Create Ranked Tournament”** as the main tournament shortcut.  
  - On the clubs hero, can **create a new club** or open **“my club”** if they already administer one.  
  - A **“My clubs”** style block on the profile is shown for this plan (club management at a glance).

Billing for Premium / Community Administrator goes through **Stripe**; users can manage/cancel subscription from the profile where applicable.

### 2.2 Site operator (`is_admin` on profile)

- **Separate** from subscription.  
- Only users with this flag can use **`/admin`** (Admin Panel): edit events, players, clubs, news, match history, rankings refresh, profiles, subscriptions, etc.  
- Think: **staff / superuser**, not “I run a local tournament.”
- There is no separate `superadmin` role in the current implementation: site-level superuser access is exactly `profiles.is_admin = true`.
- How to grant access in Supabase:
  - open the `profiles` table, find the user row by `id` (same UUID as in `auth.users`);
  - set `is_admin = true` and save;
  - revoke by setting `is_admin = false`.
- SQL example:
  - `update profiles set is_admin = true where id = '<auth_user_uuid>';`
- After granting/revoking, the user should sign in again (or refresh) so the UI picks up updated permissions.

### 2.3 Club roles

- **Member** — listed on the club; can use member benefits (e.g. copied discount codes); can leave the club.  
- **Club admin** — can edit club info, manage **join requests**, **invite** members, manage **discounts**, and handle member access popups.  
- **Owner** — club admin with **delete club** and full control; non-owners who are admins can leave admin role without deleting the club.

### 2.4 Event / tournament roles

- **Organizer (creator)** — the account that created the event/tournament: edit (where the UI allows), change **tournament visibility** (draft vs live vs public), open the **results entry** page for ranked tournaments, etc.  
- **Participant** — registers (free or paid), may pick a **qualifying heat** when the tournament is set up that way, can leave if the UI allows.

---

## 3. User journeys (end-to-end)

### 3.1 First visit and account

- From the locale home, **guests** are typically sent into the **new-visitor** flow (steps + save/continue) rather than the main “dashboard” hub.  
- **Signed-in** users land on the **dashboard**, which acts as the main hub: hero sections, news, rankings preview, upcoming events, clubs teaser, and prompts to upgrade.

### 3.2 Exploring without organizing

Anyone can use the **navigation** pillars:

- **Rankings** — global lists (laurels / singles / doubles style views).  
- **Events** — find activities and open details.  
- **Players** — search and filter directory; open a **public player profile** (ratings, history-style lists, badges).  
- **Clubs** — browse clubs and open a club page.

### 3.3 Joining an event or tournament

- **Sign in** is required for registration.  
- **Free** events: one-click style registration (after any heat selection if applicable).  
- **Paid** events: user goes through **payment** (Stripe) from a popup flow.  
- Tournaments may require **choosing a qualifying heat** when the organizer configured heats.  
- **Capacity**: UI shows filled slots vs limit when that data exists; “full” behavior follows the screen.

### 3.4 Organizing a simple **event** vs a **tournament**

| | **Simple event** (`Create New Event`) | **Tournament** (wizard) |
|---|--------------------------------------|-------------------------|
| **Purpose** | Casual meetups, local gatherings, simpler scheduling. | Structured competition: stages, seeding, bracket, optional qualifying rounds. |
| **Creation** | Shorter form (location, times, format, cover, etc.). | Multi-step wizard (details, stage structure, visibility). |
| **Ranked** | Premium+ can mark ranked when the form allows; **free plan forces unranked**. | Step asks **ranked vs unranked**; ranked results feed the **rating system**. |
| **Visibility** | Normal event page; organizer can **edit** from the card. | **Draft** tournaments are **hidden** from others until the organizer sets status to **live/public**; organizer always sees their draft. |
| **After it runs** | As designed in UI. | Organizer uses **Enter results** on a dedicated page: only the **creator** may submit bracket results; **ranked** tournaments update ratings and leaderboards. |

**Note:** In the interface, the big **“Create Ranked Tournament”** button is aimed at **Community Administrator** subscribers, but the tournament wizard URL is only protected by **login** in the current app—organizers should follow your product policy.

### 3.5 Ratings and rankings (player perspective)

- **Ranked** tournament matches change **Elo-style ratings** (singles or doubles team logic).  
- **Leaderboards** (rankings pages) are refreshed from official calculations after those matches are saved.  
- **Laurels** and **trend** on rankings are part of that competitive picture (see technical doc if needed).  
- Players see **personal preview** on the hub when their profile is linked to a player record.

### 3.6 Clubs — joining and managing

**Open clubs** (`invite only` off):

- Logged-out users see **Join Club** → directed to **sign up**.  
- Logged-in users submit a **join request** → status **Under consideration** until an admin **approves** or **declines**.  
- Admins can **invite** users; invitees see **Accept / Reject**.

**Invite-only clubs** (`locked`):

- Non-admins see **Invite only** — no open “request to join” button.

**Creating a club:**

- From the clubs hero, only **Community Administrator** subscription users get **Create Club** (or a link to their existing club). After creation, they are **owner/admin**.

**Inside a club:**

- **Admins**: edit club, pending requests inbox, invite members, discount codes, sometimes email links to other admins.  
- **Members**: see roster (with rating-style columns where data exists), perks, leave option.

### 3.7 Linking history to your account (“claim”)

- Flows like **claim history** help a user attach **historical match rows** to their login so their profile reflects past results.  
- Separate from day-to-day tournament result entry (which is organizer-only).

### 3.8 Profile and membership

- **Profile** shows account area, **subscription** management (for paid plans), tournament highlights table, rating/match badges, **events you created**, and **clubs** (with extra emphasis for Community Admins).  
- **Membership plans** page compares tiers and starts checkout.

### 3.9 Notifications

- Users can receive **in-app notifications** (e.g. club invites, join outcomes) via the header notification entry point.

### 3.10 What’s News in Admin

- The **What’s News** block content (home/dashboard news cards) is managed from the admin `news` section.
- Inside `/admin`, `news` Add/Edit actions open dedicated form pages:
  - `/{locale}/admin/news/new` — create news;
  - `/{locale}/admin/news/{id}/edit` — edit existing news.
- Supported fields:
  - `image`,
  - `title`,
  - rich-text `description`,
  - `link_text` (button text),
  - `sort_order`,
  - `created_at`.
- Image upload uses Supabase Storage bucket `news-images`; the table stores a public URL in `news.image`.
- How this works for end users on the client:
  - on home/dashboard, the block appears as **What’s New** news cards;
  - cards are paginated 3 per page;
  - ordering is controlled by admin with `sort_order` (with newer items first when sort order is equal);
  - clicking card CTA opens the dedicated `/news/{id}` page with full content and date.

---

## 4. Quick reference: “Can I …?”

| Action | Guest | Standard | Premium | Community Admin (`subscription administrator`) | Site `is_admin` |
|--------|-------|----------|---------|--------------------------------------------------|-----------------|
| View rankings / players / public events | Yes (where exposed) | Yes | Yes | Yes | Yes |
| Register / pay for events | No (must sign in) | Yes | Yes | Yes | Yes |
| Create simple event | No | Yes (1 active, unranked, free) | Yes (full form rules) | Yes | N/A |
| Hero: “Create Ranked Tournament” | No | No | No | Yes | N/A |
| Create club (hero) | No | No | No | Yes | N/A |
| Admin Panel `/admin` | No | No | No | No | Yes only |
| Enter ranked match results | No | Only if **you** created that ranked tournament | Same | Same | Same |
| Approve club join requests | No | If club admin | If club admin | If club admin | N/A |

---

## 5. Glossary

- **Event** — general listing; may or may not be a tournament; simple create flow.  
- **Tournament** — `format: Tournament`: bracket, optional heats, visibility draft/live, structure text/JSON for stages.  
- **Ranked** — results affect **ratings** and feed **rankings** refresh.  
- **Unranked** — still can have registration and bracket display, but no rating impact from the ranked pipeline.  
- **Community Administrator** — **subscription** tier name in UI (club + ranked tournament CTA); not the same as **site admin**.  
- **Site admin** — `is_admin` profile flag for `/admin` panel.

---

*Behavior reflects the application as implemented; wording on buttons may be localized per locale.*
