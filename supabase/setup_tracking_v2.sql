begin;

drop view if exists public.dashboard_kpi_overview_v2 cascade;
drop view if exists public.dashboard_assistant_funnel_v2 cascade;
drop view if exists public.dashboard_funnel_v2 cascade;
drop view if exists public.dashboard_demo_paths_v2 cascade;
drop view if exists public.dashboard_demo_tab_views_v2 cascade;
drop view if exists public.dashboard_lead_sources_v2 cascade;
drop view if exists public.dashboard_feature_priority_v2 cascade;
drop view if exists public.dashboard_daily_v2 cascade;
drop view if exists public.dashboard_funnel_practical_v2 cascade;

create or replace view public.dashboard_kpi_overview_v2 as
with
sessions as (
  select count(*)::bigint as total_sessions
  from public.landing_sessions
  where landing_version = 'v2'
),
events as (
  select
    count(*) filter (where event_name = 'demo_tab_view')::bigint as total_demo_tab_views,
    count(distinct case when event_name = 'page_view' then session_id end)::bigint as page_view_sessions,
    count(distinct case when event_name = 'cta_click' then session_id end)::bigint as cta_click_sessions,
    count(distinct case when event_name = 'demo_tab_view' then session_id end)::bigint as demo_engaged_sessions,
    count(distinct case when event_name = 'demo_open_fullscreen' then session_id end)::bigint as demo_open_fullscreen_sessions,
    count(distinct case when event_name = 'demo_close_fullscreen' then session_id end)::bigint as demo_close_fullscreen_sessions,
    count(distinct case when event_name = 'demo_tab_view' and coalesce(metadata ->> 'tab', '') = 'home' then session_id end)::bigint as home_tab_sessions,
    count(distinct case when event_name = 'demo_tab_view' and coalesce(metadata ->> 'tab', '') = 'health' then session_id end)::bigint as health_tab_sessions,
    count(distinct case when event_name = 'demo_tab_view' and coalesce(metadata ->> 'tab', '') = 'alert' then session_id end)::bigint as alert_tab_sessions,
    count(distinct case when event_name = 'demo_tab_view' and coalesce(metadata ->> 'tab', '') = 'assistant' then session_id end)::bigint as assistant_tab_sessions,
    count(distinct case when event_name = 'assistant_suggested_question_click' then session_id end)::bigint as suggested_question_sessions,
    count(distinct case when event_name = 'assistant_message_send' then session_id end)::bigint as assistant_message_sessions,
    count(distinct case when event_name = 'assistant_first_message' then session_id end)::bigint as assistant_first_message_sessions,
    count(distinct case when event_name = 'waitlist_form_start' then session_id end)::bigint as waitlist_form_start_sessions,
    count(distinct case when event_name = 'waitlist_submit' then session_id end)::bigint as waitlist_submit_sessions,
    count(distinct case when event_name = 'lead_captured' then session_id end)::bigint as lead_event_sessions
  from public.landing_events
  where landing_version = 'v2'
),
tab_depth as (
  select
    session_id,
    count(distinct coalesce(metadata ->> 'tab', 'unknown'))::int as tabs_viewed
  from public.landing_events
  where landing_version = 'v2'
    and event_name = 'demo_tab_view'
  group by session_id
),
tab_depth_agg as (
  select
    count(*) filter (where tabs_viewed >= 1)::bigint as sessions_with_1plus_tabs,
    count(*) filter (where tabs_viewed >= 2)::bigint as sessions_with_2plus_tabs,
    count(*) filter (where tabs_viewed >= 3)::bigint as sessions_with_3plus_tabs,
    count(*) filter (where tabs_viewed >= 4)::bigint as sessions_with_4_tabs
  from tab_depth
),
leads as (
  select
    count(*)::bigint as total_leads,
    count(*) filter (where lead_source = 'form')::bigint as form_leads,
    count(*) filter (where lead_source = 'chat')::bigint as chat_leads
  from public.landing_leads
  where landing_version = 'v2'
),
chat as (
  select
    count(*)::bigint as total_chat_sessions,
    avg(cs.experience_rating)::numeric(10,2) as avg_experience_rating,
    count(*) filter (where cs.email_captured = true)::bigint as chat_sessions_with_email
  from public.chat_sessions cs
  inner join public.landing_sessions ls
    on ls.session_id = cs.session_id
  where ls.landing_version = 'v2'
)
select
  s.total_sessions,
  e.page_view_sessions,
  e.cta_click_sessions,
  e.total_demo_tab_views,
  e.demo_engaged_sessions,
  e.demo_open_fullscreen_sessions,
  e.demo_close_fullscreen_sessions,
  e.home_tab_sessions,
  e.health_tab_sessions,
  e.alert_tab_sessions,
  e.assistant_tab_sessions,
  td.sessions_with_1plus_tabs,
  td.sessions_with_2plus_tabs,
  td.sessions_with_3plus_tabs,
  td.sessions_with_4_tabs,
  e.suggested_question_sessions,
  e.assistant_message_sessions,
  e.assistant_first_message_sessions,
  e.waitlist_form_start_sessions,
  e.waitlist_submit_sessions,
  e.lead_event_sessions,
  l.total_leads,
  l.form_leads,
  l.chat_leads,
  c.total_chat_sessions,
  c.chat_sessions_with_email,
  c.avg_experience_rating,
  round(100.0 * e.cta_click_sessions / nullif(s.total_sessions, 0), 2) as cta_click_rate_pct,
  round(100.0 * e.demo_engaged_sessions / nullif(s.total_sessions, 0), 2) as demo_engagement_rate_pct,
  round(100.0 * e.demo_open_fullscreen_sessions / nullif(s.total_sessions, 0), 2) as mobile_fullscreen_rate_pct,
  round(100.0 * e.assistant_tab_sessions / nullif(s.total_sessions, 0), 2) as assistant_tab_rate_pct,
  round(100.0 * e.assistant_first_message_sessions / nullif(e.assistant_tab_sessions, 0), 2) as assistant_first_message_rate_pct,
  round(100.0 * e.suggested_question_sessions / nullif(e.assistant_tab_sessions, 0), 2) as suggested_question_ctr_pct,
  round(100.0 * e.waitlist_form_start_sessions / nullif(s.total_sessions, 0), 2) as waitlist_form_start_rate_pct,
  round(100.0 * e.waitlist_submit_sessions / nullif(s.total_sessions, 0), 2) as waitlist_submit_rate_pct,
  round(100.0 * l.total_leads / nullif(s.total_sessions, 0), 2) as lead_conversion_rate_pct
from sessions s
cross join events e
cross join tab_depth_agg td
cross join leads l
cross join chat c;

create or replace view public.dashboard_assistant_funnel_v2 as
with steps as (
  select 1 as step_order, 'page_view'::text as step_name, count(distinct session_id)::bigint as sessions
  from public.landing_events
  where landing_version = 'v2'
    and event_name = 'page_view'

  union all

  select 2, 'cta_click', count(distinct session_id)::bigint
  from public.landing_events
  where landing_version = 'v2'
    and event_name = 'cta_click'

  union all

  select 3, 'demo_tab_view_any', count(distinct session_id)::bigint
  from public.landing_events
  where landing_version = 'v2'
    and event_name = 'demo_tab_view'

  union all

  select 4, 'assistant_tab_view', count(distinct session_id)::bigint
  from public.landing_events
  where landing_version = 'v2'
    and event_name = 'demo_tab_view'
    and coalesce(metadata ->> 'tab', '') = 'assistant'

  union all

  select 5, 'assistant_first_message', count(distinct session_id)::bigint
  from public.landing_events
  where landing_version = 'v2'
    and event_name = 'assistant_first_message'

  union all

  select 6, 'waitlist_form_start', count(distinct session_id)::bigint
  from public.landing_events
  where landing_version = 'v2'
    and event_name = 'waitlist_form_start'

  union all

  select 7, 'waitlist_submit', count(distinct session_id)::bigint
  from public.landing_events
  where landing_version = 'v2'
    and event_name = 'waitlist_submit'

  union all

  select 8, 'lead_captured', count(distinct session_id)::bigint
  from public.landing_leads
  where landing_version = 'v2'
    and session_id is not null
)
select
  step_order,
  step_name,
  sessions,
  lag(sessions) over (order by step_order) as previous_step_sessions,
  round(
    100.0 * sessions / nullif(lag(sessions) over (order by step_order), 0),
    2
  ) as step_conversion_pct
from steps
order by step_order;

create or replace view public.dashboard_funnel_v2 as
select *
from public.dashboard_assistant_funnel_v2;

create or replace view public.dashboard_demo_paths_v2 as
with session_tabs as (
  select
    session_id,
    bool_or(coalesce(metadata ->> 'tab', '') = 'home') as saw_home,
    bool_or(coalesce(metadata ->> 'tab', '') = 'health') as saw_health,
    bool_or(coalesce(metadata ->> 'tab', '') = 'alert') as saw_alert,
    bool_or(coalesce(metadata ->> 'tab', '') = 'assistant') as saw_assistant,
    count(distinct coalesce(metadata ->> 'tab', 'unknown'))::int as tab_count
  from public.landing_events
  where landing_version = 'v2'
    and event_name = 'demo_tab_view'
  group by session_id
)
select
  count(*)::bigint as total_demo_sessions,
  count(*) filter (where saw_home)::bigint as home_tab_sessions,
  count(*) filter (where saw_health)::bigint as health_tab_sessions,
  count(*) filter (where saw_alert)::bigint as alert_tab_sessions,
  count(*) filter (where saw_assistant)::bigint as assistant_tab_sessions,
  count(*) filter (where tab_count >= 2)::bigint as sessions_with_2plus_tabs,
  count(*) filter (where tab_count >= 3)::bigint as sessions_with_3plus_tabs,
  count(*) filter (where tab_count >= 4)::bigint as sessions_with_4_tabs,
  count(*) filter (where saw_home and saw_health and saw_alert and saw_assistant)::bigint as all_four_tabs_sessions
from session_tabs;

create or replace view public.dashboard_demo_tab_views_v2 as
select
  coalesce(metadata ->> 'tab', 'unknown') as demo_tab,
  device_type,
  count(*)::bigint as total_views,
  count(distinct session_id)::bigint as unique_sessions
from public.landing_events
where landing_version = 'v2'
  and event_name = 'demo_tab_view'
group by 1, 2
order by total_views desc, unique_sessions desc;

create or replace view public.dashboard_lead_sources_v2 as
select
  lead_source,
  count(*)::bigint as total_leads,
  count(distinct session_id)::bigint as unique_sessions,
  round(100.0 * count(*) / nullif(sum(count(*)) over (), 0), 2) as share_pct
from public.landing_leads
where landing_version = 'v2'
group by lead_source
order by total_leads desc;

create or replace view public.dashboard_feature_priority_v2 as
with priorities as (
  select feature_priority
  from public.landing_leads
  where landing_version = 'v2'
    and feature_priority is not null

  union all

  select cs.feature_priority
  from public.chat_sessions cs
  inner join public.landing_sessions ls
    on ls.session_id = cs.session_id
  where ls.landing_version = 'v2'
    and cs.feature_priority is not null
)
select
  feature_priority,
  count(*)::bigint as total
from priorities
group by feature_priority
order by total desc, feature_priority asc;

create or replace view public.dashboard_daily_v2 as
with session_daily as (
  select
    date_trunc('day', started_at)::date as day,
    count(*)::bigint as sessions
  from public.landing_sessions
  where landing_version = 'v2'
  group by 1
),
event_daily as (
  select
    date_trunc('day', created_at)::date as day,
    count(*) filter (where event_name = 'cta_click')::bigint as cta_clicks,
    count(*) filter (where event_name = 'demo_open_fullscreen')::bigint as demo_open_fullscreen,
    count(*) filter (where event_name = 'demo_tab_view')::bigint as demo_tab_views,
    count(distinct case when event_name = 'demo_tab_view' then session_id end)::bigint as demo_sessions,
    count(distinct case when event_name = 'demo_tab_view' and coalesce(metadata ->> 'tab', '') = 'assistant' then session_id end)::bigint as assistant_tab_sessions,
    count(*) filter (where event_name = 'assistant_suggested_question_click')::bigint as suggested_question_clicks,
    count(*) filter (where event_name = 'assistant_message_send')::bigint as assistant_messages,
    count(*) filter (where event_name = 'assistant_first_message')::bigint as assistant_first_messages,
    count(*) filter (where event_name = 'waitlist_form_start')::bigint as waitlist_form_starts,
    count(*) filter (where event_name = 'waitlist_submit')::bigint as waitlist_submits,
    count(*) filter (where event_name = 'lead_captured')::bigint as lead_events
  from public.landing_events
  where landing_version = 'v2'
  group by 1
),
lead_daily as (
  select
    date_trunc('day', created_at)::date as day,
    count(*)::bigint as leads,
    count(*) filter (where lead_source = 'form')::bigint as form_leads,
    count(*) filter (where lead_source = 'chat')::bigint as chat_leads
  from public.landing_leads
  where landing_version = 'v2'
  group by 1
)
select
  coalesce(s.day, e.day, l.day) as day,
  coalesce(s.sessions, 0) as sessions,
  coalesce(e.cta_clicks, 0) as cta_clicks,
  coalesce(e.demo_open_fullscreen, 0) as demo_open_fullscreen,
  coalesce(e.demo_tab_views, 0) as demo_tab_views,
  coalesce(e.demo_sessions, 0) as demo_sessions,
  coalesce(e.assistant_tab_sessions, 0) as assistant_tab_sessions,
  coalesce(e.suggested_question_clicks, 0) as suggested_question_clicks,
  coalesce(e.assistant_messages, 0) as assistant_messages,
  coalesce(e.assistant_first_messages, 0) as assistant_first_messages,
  coalesce(e.waitlist_form_starts, 0) as waitlist_form_starts,
  coalesce(e.waitlist_submits, 0) as waitlist_submits,
  coalesce(e.lead_events, 0) as lead_events,
  coalesce(l.leads, 0) as leads,
  coalesce(l.form_leads, 0) as form_leads,
  coalesce(l.chat_leads, 0) as chat_leads
from session_daily s
full outer join event_daily e on e.day = s.day
full outer join lead_daily l on l.day = coalesce(s.day, e.day)
order by day desc;

create or replace view public.dashboard_funnel_practical_v2 as
with sessions as (
  select *
  from public.landing_sessions
  where landing_version = 'v2'
),
events as (
  select *
  from public.landing_events
  where landing_version = 'v2'
),
leads as (
  select *
  from public.landing_leads
  where landing_version = 'v2'
),
chat as (
  select cs.*
  from public.chat_sessions cs
  inner join public.landing_sessions ls
    on ls.session_id = cs.session_id
  where ls.landing_version = 'v2'
),
session_tab_depth as (
  select
    session_id,
    count(distinct coalesce(metadata ->> 'tab', 'unknown'))::int as tab_count
  from events
  where event_name = 'demo_tab_view'
  group by session_id
),
session_flags as (
  select
    ls.session_id,
    ls.device_type,
    ls.started_at,
    ls.ended_at,
    ls.lead_captured,

    exists (select 1 from events e where e.session_id = ls.session_id and e.event_name = 'page_view') as has_page_view,
    exists (select 1 from events e where e.session_id = ls.session_id and e.event_name = 'cta_click') as has_cta_click,
    exists (select 1 from events e where e.session_id = ls.session_id and e.event_name = 'demo_open_fullscreen') as has_demo_open_fullscreen,
    exists (select 1 from events e where e.session_id = ls.session_id and e.event_name = 'demo_tab_view') as has_demo_engagement,

    exists (
      select 1 from events e
      where e.session_id = ls.session_id
        and e.event_name = 'demo_tab_view'
        and coalesce(e.metadata ->> 'tab', '') = 'home'
    ) as has_home_tab,

    exists (
      select 1 from events e
      where e.session_id = ls.session_id
        and e.event_name = 'demo_tab_view'
        and coalesce(e.metadata ->> 'tab', '') = 'health'
    ) as has_health_tab,

    exists (
      select 1 from events e
      where e.session_id = ls.session_id
        and e.event_name = 'demo_tab_view'
        and coalesce(e.metadata ->> 'tab', '') = 'alert'
    ) as has_alert_tab,

    exists (
      select 1 from events e
      where e.session_id = ls.session_id
        and e.event_name = 'demo_tab_view'
        and coalesce(e.metadata ->> 'tab', '') = 'assistant'
    ) as has_assistant_tab,

    coalesce(std.tab_count, 0) >= 2 as has_two_plus_tabs,
    coalesce(std.tab_count, 0) >= 3 as has_three_plus_tabs,
    coalesce(std.tab_count, 0) >= 4 as has_four_tabs,

    exists (
      select 1 from events e
      where e.session_id = ls.session_id
        and e.event_name = 'assistant_suggested_question_click'
    ) as has_suggested_question_click,

    exists (
      select 1 from events e
      where e.session_id = ls.session_id
        and e.event_name = 'assistant_message_send'
    ) as has_assistant_message,

    exists (
      select 1 from events e
      where e.session_id = ls.session_id
        and e.event_name = 'assistant_first_message'
    ) as has_assistant_first_message,

    exists (
      select 1 from events e
      where e.session_id = ls.session_id
        and e.event_name = 'waitlist_form_start'
    ) as has_waitlist_form_start,

    exists (
      select 1 from events e
      where e.session_id = ls.session_id
        and e.event_name = 'waitlist_submit'
    ) as has_waitlist_submit,

    exists (
      select 1 from events e
      where e.session_id = ls.session_id
        and e.event_name = 'lead_captured'
    ) as has_lead_captured_event,

    exists (
      select 1 from leads l
      where l.session_id = ls.session_id
        and l.lead_source = 'form'
    ) as has_form_lead,

    exists (
      select 1 from leads l
      where l.session_id = ls.session_id
        and l.lead_source = 'chat'
    ) as has_chat_lead,

    exists (
      select 1 from chat c
      where c.session_id = ls.session_id
    ) as has_chat_session

  from sessions ls
  left join session_tab_depth std
    on std.session_id = ls.session_id
),
top_demo_tab as (
  select
    coalesce(metadata ->> 'tab', 'unknown') as top_demo_tab,
    count(*) as total_views,
    row_number() over (
      order by count(*) desc, coalesce(metadata ->> 'tab', 'unknown') asc
    ) as rn
  from events
  where event_name = 'demo_tab_view'
  group by coalesce(metadata ->> 'tab', 'unknown')
),
top_suggested_question as (
  select
    coalesce(metadata ->> 'question', 'unknown') as top_suggested_question,
    count(*) as total_clicks,
    row_number() over (
      order by count(*) desc, coalesce(metadata ->> 'question', 'unknown') asc
    ) as rn
  from events
  where event_name = 'assistant_suggested_question_click'
  group by coalesce(metadata ->> 'question', 'unknown')
),
top_form_priority as (
  select
    feature_priority as top_explicit_priority_from_form,
    count(*) as total_leads,
    row_number() over (
      order by count(*) desc, feature_priority asc
    ) as rn
  from leads
  where lead_source = 'form'
    and feature_priority is not null
  group by feature_priority
),
top_chat_topic as (
  select
    inferred_topic as top_inferred_topic_from_chat,
    count(*) as total_sessions,
    row_number() over (
      order by count(*) desc, inferred_topic asc
    ) as rn
  from chat
  where inferred_topic is not null
  group by inferred_topic
),
chat_message_stats as (
  select
    cs.session_id,
    count(cm.id) as total_messages,
    count(cm.id) filter (where cm.role = 'user') as user_messages,
    count(cm.id) filter (where cm.role = 'assistant') as assistant_messages
  from public.chat_sessions cs
  join public.landing_sessions ls
    on ls.session_id = cs.session_id
   and ls.landing_version = 'v2'
  left join public.chat_messages cm
    on cm.chat_session_id = cs.chat_session_id
  group by cs.session_id
)
select
  count(*)::bigint as total_sessions,
  count(*) filter (where has_page_view)::bigint as page_view_sessions,

  count(*) filter (where has_cta_click)::bigint as cta_click_sessions,
  round(100.0 * count(*) filter (where has_cta_click) / nullif(count(*), 0), 2) as cta_click_rate_pct,

  count(*) filter (where has_demo_engagement)::bigint as demo_engaged_sessions,
  round(100.0 * count(*) filter (where has_demo_engagement) / nullif(count(*), 0), 2) as demo_engagement_rate_pct,

  count(*) filter (where has_demo_open_fullscreen)::bigint as demo_open_fullscreen_sessions,
  round(100.0 * count(*) filter (where has_demo_open_fullscreen) / nullif(count(*), 0), 2) as mobile_fullscreen_rate_pct,

  count(*) filter (where has_home_tab)::bigint as home_tab_sessions,
  count(*) filter (where has_health_tab)::bigint as health_tab_sessions,
  count(*) filter (where has_alert_tab)::bigint as alert_tab_sessions,
  count(*) filter (where has_assistant_tab)::bigint as assistant_tab_sessions,

  count(*) filter (where has_two_plus_tabs)::bigint as sessions_with_2plus_tabs,
  count(*) filter (where has_three_plus_tabs)::bigint as sessions_with_3plus_tabs,
  count(*) filter (where has_four_tabs)::bigint as sessions_with_4_tabs,

  (select top_demo_tab from top_demo_tab where rn = 1) as top_demo_tab,
  (select total_views from top_demo_tab where rn = 1) as top_demo_tab_views,

  count(*) filter (where has_assistant_tab)::bigint as total_assistant_tab_sessions,
  round(100.0 * count(*) filter (where has_assistant_tab) / nullif(count(*), 0), 2) as assistant_tab_rate_pct,

  count(*) filter (where has_suggested_question_click)::bigint as suggested_question_sessions,
  round(
    100.0 * count(*) filter (where has_suggested_question_click)
    / nullif(count(*) filter (where has_assistant_tab), 0),
    2
  ) as suggested_question_ctr_pct,

  (select top_suggested_question from top_suggested_question where rn = 1) as top_suggested_question,
  (select total_clicks from top_suggested_question where rn = 1) as top_suggested_question_clicks,

  count(*) filter (where has_assistant_first_message)::bigint as total_chat_first_messages,
  round(
    100.0 * count(*) filter (where has_assistant_first_message)
    / nullif(count(*) filter (where has_assistant_tab), 0),
    2
  ) as chat_first_message_rate_pct,

  count(*) filter (where has_assistant_message)::bigint as active_chat_sessions,
  round(
    100.0 * count(*) filter (where has_assistant_message)
    / nullif(count(*), 0),
    2
  ) as active_chat_session_rate_pct,

  round(avg(cms.total_messages) filter (where cms.user_messages > 0), 2) as avg_total_messages_per_active_chat_session,
  round(avg(cms.user_messages) filter (where cms.user_messages > 0), 2) as avg_user_messages_per_active_chat_session,

  count(*) filter (where has_waitlist_form_start)::bigint as waitlist_form_start_sessions,
  round(
    100.0 * count(*) filter (where has_waitlist_form_start)
    / nullif(count(*), 0),
    2
  ) as waitlist_form_start_rate_pct,

  count(*) filter (where has_waitlist_submit)::bigint as waitlist_submit_sessions,
  round(
    100.0 * count(*) filter (where has_waitlist_submit)
    / nullif(count(*), 0),
    2
  ) as waitlist_submit_rate_pct,

  count(*) filter (where has_form_lead)::bigint as total_form_lead_sessions,
  count(*) filter (where has_chat_lead)::bigint as total_chat_lead_sessions,
  count(*) filter (where has_form_lead or has_chat_lead or has_lead_captured_event or lead_captured)::bigint as total_lead_sessions,

  round(
    100.0 * count(*) filter (where has_form_lead or has_chat_lead or has_lead_captured_event or lead_captured)
    / nullif(count(*), 0),
    2
  ) as session_to_lead_conversion_pct,

  round(
    100.0 * count(*) filter (where has_form_lead)
    / nullif(count(*), 0),
    2
  ) as form_to_lead_conversion_pct,

  round(
    100.0 * count(*) filter (where has_chat_lead)
    / nullif(count(*) filter (where has_assistant_tab), 0),
    2
  ) as chat_to_lead_conversion_pct,

  (select top_explicit_priority_from_form from top_form_priority where rn = 1) as top_explicit_priority_from_form,
  (select total_leads from top_form_priority where rn = 1) as top_explicit_priority_count,
  (select top_inferred_topic_from_chat from top_chat_topic where rn = 1) as top_inferred_topic_from_chat,
  (select total_sessions from top_chat_topic where rn = 1) as top_inferred_topic_sessions

from session_flags sf
left join chat_message_stats cms
  on cms.session_id = sf.session_id;

commit;
