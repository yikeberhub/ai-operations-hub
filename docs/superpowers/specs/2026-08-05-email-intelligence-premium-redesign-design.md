# Email Intelligence Dashboard — Premium Redesign

Date: 2026-08-05

## Goal

The Email Intelligence dashboard (`app/(dashboard)/email-intelligence/`) currently loads every email unfiltered, has no pagination, no way to see past reply attempts, no way to delete an email, and uses the default grayscale shadcn theme (zero-chroma `--primary`). This redesign adds filtering, pagination, a per-email reply history view, delete, and a premium indigo/violet visual pass.

## Data model notes (no migration needed)

- `emails` table already has `category`, `priority`, `status`, `from_address`, `subject`, `created_at` — sufficient for filtering/search.
- There is no dedicated "replies" table. Each email has a single `draft_reply` field and a `status` enum that becomes `"replied"` after a successful send. The only historical trail of send attempts lives in `workflow_logs`, where `sendEmailReply()` already inserts a row per attempt (`workflow_name: "send_email_reply"`, `status: "success" | "failure"`, `payload: { emailId }`, `error_details` on failure).
- "Reply history" in this design means: read that existing `workflow_logs` trail per email. No new table.

## 1. Filtering

- New client component `components/emails/emails-toolbar.tsx`, rendered above the table.
- Controls: a debounced search input (matches `from_address` or `subject` via `ilike`), and three `Select` dropdowns for Category / Priority / Status (reusing existing shadcn `Select`).
- Filter state lives in the URL as query params: `?q=&category=&priority=&status=&page=`. Changing a control calls `router.push` with the updated query string (via `useRouter`/`useSearchParams`, preserving other params).
- An active-filter-count badge and a "Clear filters" button (X icon) appear once any filter is set.

## 2. Pagination

- Server-side, 20 rows per page.
- `page.tsx` reads `searchParams.page` (default 1), applies `.range((page-1)*20, page*20 - 1)` to the Supabase query, and requests `{ count: "exact" }` for the total.
- New component `components/emails/emails-pagination.tsx`: Prev/Next buttons (chevron icons), disabled at the boundaries, "Page X of Y" label. Updates the `page` URL param only, preserving filters.
- Changing any filter resets `page` to 1.

## 3. Reply history

- New server action `getEmailReplyHistory(emailId)` in `lib/actions/emails.ts`: queries `workflow_logs` where `workflow_name = 'send_email_reply'` and `payload->>emailId = emailId`, ordered `created_at desc`.
- Called from `EmailDetailSheet` lazily (on open / when `email.id` changes) via a `useEffect` + `startTransition`, not preloaded for every row on the list page.
- Rendered as a small vertical timeline below the draft-reply box: a `CheckCircle2` (emerald) icon for success or `AlertCircle` (rose) icon for failure, relative timestamp, and the error message inline when failed.
- Empty state: "No replies sent yet."

## 4. Delete email

- New server action `deleteEmail(emailId)` in `lib/actions/emails.ts`: `supabase.from("emails").delete().eq("id", emailId)`, then `revalidatePath`. Does **not** delete associated `workflow_logs` rows — those remain as an audit trail even after the email is gone.
- Entry points:
  - A small trash icon button at the end of each table row (`stopPropagation` so it doesn't also open the detail sheet).
  - A "Delete" button in `EmailDetailSheet`'s footer, visually separated (left-aligned, destructive variant) from Save/Send.
- Both route through one shared shadcn `AlertDialog` confirmation: "This will permanently delete this email. This can't be undone." Cancel / Delete (destructive).

## 5. Premium visual pass

- `app/globals.css`: replace the zero-chroma `--primary` (currently pure grayscale) with an indigo/violet accent, in both `:root` and `.dark`, and update `--ring` / `--sidebar-primary` to match. Existing semantic badge colors (rose=HOT/spam, amber=WARM/billing/processing, sky=COLD/support/processed, emerald=sales/replied, violet=new) are kept as-is — they already read fine against an indigo primary.
- Stat cards (`components/dashboard/stat-card.tsx`): add a subtle colored top border matching each card's accent, plus a soft shadow on hover.
- Table: sticky header row, subtle background highlight on row hover, slightly increased vertical padding for breathing room.
- Headings (`h1` etc. on the page): heavier font-weight and tighter letter-spacing for a more "designed" feel. No new font import — reuse the existing Geist Sans family to avoid layout-shift/perf risk.
- New icons used throughout: `Search`, `Filter`, `X`, `ChevronLeft`, `ChevronRight`, `History`, `CheckCircle2`, `AlertCircle`, `Trash2` (all `lucide-react`, already a project dependency).

## Out of scope

- No new database migration (all data needed already exists).
- No multi-message reply threads — the data model only supports one reply per email today; extending that is a separate, larger change if ever needed.
- No bulk-select/bulk-delete — single-row delete only.
- No new font family.
