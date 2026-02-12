create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  message text not null,
  ip_address text,
  created_at timestamptz not null default now()
);

-- RLS: anon can insert (public contact form), only service role can read
alter table contact_messages enable row level security;

create policy "Allow anonymous inserts" on contact_messages
  for insert with check (true);
