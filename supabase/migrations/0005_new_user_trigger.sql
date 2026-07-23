-- Auto-provision a profile (attached to the single seeded org) whenever a new
-- auth.users row is created. Single-tenant for now; swap the org lookup for an
-- invite-based org_id once multi-tenant signup exists.
create or replace function handle_new_user()
returns trigger as $$
declare
  default_org_id uuid;
begin
  select id into default_org_id from orgs order by created_at asc limit 1;

  insert into profiles (id, org_id, full_name, role)
  values (new.id, default_org_id, new.raw_user_meta_data->>'full_name', 'admin');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
