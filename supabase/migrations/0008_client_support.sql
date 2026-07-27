-- Customers now sign up directly (public signup = 'client' role, no admin access).
-- Leads gain an optional client_id so a logged-in client can see the
-- messages/leads they personally submitted, separate from staff's org-wide view.
alter table leads add column if not exists client_id uuid references auth.users(id) on delete set null;
create index if not exists leads_client_id_idx on leads(client_id);

-- Public signup should default to the lowest-privilege role. Admin/agent accounts
-- are promoted manually (dashboard or direct SQL) after creation.
create or replace function handle_new_user()
returns trigger as $$
declare
  default_org_id uuid;
begin
  select id into default_org_id from public.orgs order by created_at asc limit 1;

  insert into public.profiles (id, org_id, full_name, role)
  values (new.id, default_org_id, new.raw_user_meta_data->>'full_name', 'client');

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function is_staff()
returns boolean as $$
  select role in ('admin', 'agent') from public.profiles where id = auth.uid()
$$ language sql stable security definer set search_path = public;

-- Replace the blanket org-wide leads policy with role-aware access: staff see
-- and manage every lead in their org, clients only see/create their own.
drop policy if exists "leads: org access" on leads;

create policy "leads: staff org access" on leads
  for all using (org_id = current_org_id() and is_staff())
  with check (org_id = current_org_id() and is_staff());

create policy "leads: client read own" on leads
  for select using (client_id = auth.uid());

create policy "leads: client insert own" on leads
  for insert with check (client_id = auth.uid() and org_id = current_org_id());
