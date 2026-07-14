-- resource_documents is populated by the sync_resources edge function (service role)
-- and read by the Resources page. It was created outside tracked migrations, so this
-- defensively ensures RLS is on with a read-only policy for signed-in users.
-- Guarded so it is a no-op if the table does not exist in a given environment.

do $$
begin
  if to_regclass('public.resource_documents') is not null then
    execute 'alter table public.resource_documents enable row level security';

    execute 'drop policy if exists resource_documents_select_authenticated on public.resource_documents';
    execute 'create policy resource_documents_select_authenticated
      on public.resource_documents
      for select
      to authenticated
      using (true)';
  end if;
end
$$;
