create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  message text not null,
  ip_address text,
  created_at timestamptz not null default now()
);

-- RLS: only service role can insert (via server-side API route)
alter table contact_messages enable row level security;
