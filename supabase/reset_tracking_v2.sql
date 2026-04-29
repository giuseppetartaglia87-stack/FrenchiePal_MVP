begin;

truncate table
  public.chat_messages,
  public.chat_sessions,
  public.landing_events,
  public.landing_leads,
  public.landing_sessions
restart identity cascade;

commit;