-- Core multi-tenant-ready schema. Single org is seeded for now (see 0006_seed_org.sql)
-- but every domain table carries org_id + RLS so real multi-tenancy is a policy change,
-- not a rewrite.

create table if not exists orgs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

create type user_role as enum ('admin', 'agent');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  full_name text,
  role user_role not null default 'agent',
  created_at timestamptz not null default now()
);

create type lead_priority as enum ('HOT', 'WARM', 'COLD');
create type lead_status as enum ('new', 'processing', 'qualified', 'contacted', 'closed');

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  full_name text not null,
  email text not null,
  company text,
  phone text,
  message text,
  source text default 'manual',
  score int check (score >= 0 and score <= 100),
  priority lead_priority,
  status lead_status not null default 'new',
  ai_summary text,
  next_action text,
  draft_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type email_category as enum ('sales', 'support', 'billing', 'spam', 'other');
create type email_priority as enum ('HOT', 'WARM', 'COLD');
create type email_status as enum ('new', 'processing', 'processed', 'replied');

create table if not exists emails (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  thread_id text,
  from_address text not null,
  subject text,
  body text not null,
  category email_category,
  priority email_priority,
  status email_status not null default 'new',
  ai_summary text,
  draft_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type document_status as enum ('processing', 'ready', 'failed');

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  title text not null,
  storage_path text not null,
  status document_status not null default 'processing',
  error text,
  created_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  title text,
  escalated boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  confidence numeric,
  created_at timestamptz not null default now()
);

create type workflow_source as enum ('app', 'n8n');
create type workflow_status as enum ('success', 'failure');

create table if not exists workflow_logs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  source workflow_source not null default 'app',
  workflow_name text not null,
  status workflow_status not null,
  duration_ms int,
  payload jsonb,
  error_details jsonb,
  created_at timestamptz not null default now()
);

-- updated_at trigger helper
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();

create trigger emails_set_updated_at before update on emails
  for each row execute function set_updated_at();

-- indexes
create index if not exists leads_org_id_idx on leads(org_id);
create index if not exists leads_priority_idx on leads(priority);
create index if not exists emails_org_id_idx on emails(org_id);
create index if not exists emails_category_idx on emails(category);
create index if not exists document_chunks_org_id_idx on document_chunks(org_id);
create index if not exists workflow_logs_org_id_idx on workflow_logs(org_id);
create index if not exists workflow_logs_created_at_idx on workflow_logs(created_at desc);

-- vector similarity index (HNSW, cosine distance)
create index if not exists document_chunks_embedding_idx on document_chunks
  using hnsw (embedding vector_cosine_ops);
