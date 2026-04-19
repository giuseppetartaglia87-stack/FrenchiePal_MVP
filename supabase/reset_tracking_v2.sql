-- FrenchiePal V2 reset
-- Esegui questo script nel SQL Editor di Supabase
-- per cancellare i dati storici e ripartire pulito.

begin;

truncate table if exists public.events restart identity cascade;
truncate table if exists public.waitlist_leads restart identity cascade;

truncate table if exists
  public.chat_messages,
  public.chat_sessions,
  public.landing_events,
  public.landing_leads,
  public.landing_sessions
restart identity cascade;

commit;
