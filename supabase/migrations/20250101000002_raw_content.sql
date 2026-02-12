-- Raw markdown content storage (source of truth for content/ directory)
create table raw_content (
  path text primary key,
  content text not null,
  updated_at timestamptz default now()
);
