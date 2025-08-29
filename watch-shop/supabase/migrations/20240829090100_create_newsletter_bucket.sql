-- Create a storage bucket for newsletter assets
insert into storage.buckets (id, name, public)
values ('newsletter', 'newsletter', true)
on conflict (id) do nothing;

-- Set up storage policies for the newsletter bucket
create policy "Public Access for newsletter assets"
on storage.objects for select
using (bucket_id = 'newsletter');

create policy "Allow insert for authenticated users"
on storage.objects for insert
to authenticated
with check (bucket_id = 'newsletter');

create policy "Allow update for authenticated users"
on storage.objects for update
to authenticated
using (bucket_id = 'newsletter');

-- Create a function to get a public URL for newsletter assets
create or replace function get_newsletter_asset_url(filename text)
returns text as $$
  select storage.url_join(
    storage.url_get_origin()::text,
    storage.url_encode('newsletter') || '/' || storage.url_encode(filename)
  );
$$ language sql;
