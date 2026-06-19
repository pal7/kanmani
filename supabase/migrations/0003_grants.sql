-- Grant table-level privileges to roles.
-- Supabase does not automatically grant privileges when tables are created
-- outside the Supabase dashboard. RLS policies alone are not enough —
-- the role must also have the underlying table privilege.

grant select, insert, update, delete on public.chats    to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

grant select on public.chats    to anon;
grant select on public.messages to anon;

grant select, insert, update, delete on public.chats    to service_role;
grant select, insert, update, delete on public.messages to service_role;
