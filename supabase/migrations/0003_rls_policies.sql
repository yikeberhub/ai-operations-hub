-- Row Level Security: users can only see/write rows belonging to their org.
-- Service-role key (used by server actions/API routes and n8n) bypasses RLS entirely,
-- so this only constrains browser/client-side access via the anon key.

alter table orgs enable row level security;
alter table profiles enable row level security;
alter table leads enable row level security;
alter table emails enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table workflow_logs enable row level security;

create or replace function current_org_id()
returns uuid as $$
  select org_id from profiles where id = auth.uid()
$$ language sql stable security definer;

create policy "profiles: read own org" on profiles
  for select using (org_id = current_org_id());

create policy "orgs: read own org" on orgs
  for select using (id = current_org_id());

create policy "leads: org access" on leads
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

create policy "emails: org access" on emails
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

create policy "documents: org access" on documents
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

create policy "document_chunks: org access" on document_chunks
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

create policy "chat_sessions: org access" on chat_sessions
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

create policy "chat_messages: org access" on chat_messages
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

create policy "workflow_logs: org access" on workflow_logs
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());
