import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLES = {
  landingSessions:
    process.env.SUPABASE_TABLE_LANDING_SESSIONS || 'landing_sessions',
  landingEvents: process.env.SUPABASE_TABLE_LANDING_EVENTS || 'landing_events',
  landingLeads: process.env.SUPABASE_TABLE_LANDING_LEADS || 'landing_leads',
  chatSessions: process.env.SUPABASE_TABLE_CHAT_SESSIONS || 'chat_sessions',
  chatMessages: process.env.SUPABASE_TABLE_CHAT_MESSAGES || 'chat_messages'
};

function nowIso() {
  return new Date().toISOString();
}

export function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

export function normalizeDeviceType(deviceType, userAgent = '') {
  if (deviceType === 'mobile' || deviceType === 'desktop') {
    return deviceType;
  }

  return /android|iphone|ipad|ipod|mobile/i.test(userAgent || '')
    ? 'mobile'
    : 'desktop';
}

export function normalizeLandingVersion(landingVersion) {
  return landingVersion || 'v2';
}

async function safeInsert(table, row) {
  const { data, error } = await supabase.from(table).insert([row]).select();

  if (error) {
    console.error(`Insert failed for ${table}:`, error);
  }

  return { data, error };
}

async function safeUpsert(table, row, onConflict) {
  const { data, error } = await supabase
    .from(table)
    .upsert([row], onConflict ? { onConflict } : undefined)
    .select();

  if (error) {
    console.error(`Upsert failed for ${table}:`, error);
  }

  return { data, error };
}

export async function upsertLandingSession({
  sessionId,
  startedAt,
  endedAt,
  leadCaptured,
  deviceType,
  landingVersion,
  userAgent
}) {
  if (!sessionId) return { data: null, error: null };

  const row = {
    session_id: sessionId,
    landing_version: normalizeLandingVersion(landingVersion),
    device_type: normalizeDeviceType(deviceType, userAgent),
    started_at: startedAt || nowIso()
  };

  if (endedAt) {
    row.ended_at = endedAt;
  }

  if (typeof leadCaptured === 'boolean') {
    row.lead_captured = leadCaptured;
  }

  return safeUpsert(TABLES.landingSessions, row, 'session_id');
}

export async function markSessionLeadCaptured(args = {}) {
  return upsertLandingSession({
    ...args,
    leadCaptured: true
  });
}

export async function trackEvent({
  sessionId,
  eventName,
  sourceSection,
  deviceType,
  landingVersion,
  metadata = {},
  createdAt,
  startedAt,
  endedAt,
  leadCaptured,
  userAgent
}) {
  if (!eventName) {
    return { data: null, error: new Error('Missing eventName') };
  }

  if (!sessionId) {
    return { data: null, error: new Error('Missing sessionId') };
  }

  await upsertLandingSession({
    sessionId,
    startedAt,
    endedAt,
    leadCaptured,
    deviceType,
    landingVersion,
    userAgent
  });

  return safeInsert(TABLES.landingEvents, {
    session_id: sessionId,
    event_name: eventName,
    source_section: sourceSection || null,
    device_type: normalizeDeviceType(deviceType, userAgent),
    landing_version: normalizeLandingVersion(landingVersion),
    metadata,
    created_at: createdAt || nowIso()
  });
}

export async function saveLead({
  sessionId,
  email,
  leadSource,
  landingVersion,
  featurePriority,
  experienceRating,
  assistantTopic,
  createdAt
}) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return { data: null, error: new Error('Missing email') };
  }

  return safeInsert(TABLES.landingLeads, {
    session_id: sessionId || null,
    email: normalizedEmail,
    lead_source: leadSource || null,
    landing_version: normalizeLandingVersion(landingVersion),
    feature_priority: featurePriority || null,
    experience_rating: experienceRating || null,
    assistant_topic: assistantTopic || null,
    created_at: createdAt || nowIso()
  });
}

export async function createChatSession({
  chatSessionId,
  sessionId,
  startedAt,
  endedAt,
  deviceType,
  entryPoint = 'assistant',
  emailCaptured,
  featurePriority,
  experienceRating,
  inferredTopic
}) {
  if (!chatSessionId || !sessionId) {
    return { data: null, error: new Error('Missing chatSessionId or sessionId') };
  }

  const row = {
    chat_session_id: chatSessionId,
    session_id: sessionId,
    started_at: startedAt || nowIso(),
    device_type: deviceType || 'desktop',
    entry_point: entryPoint
  };

  if (endedAt) row.ended_at = endedAt;
  if (typeof emailCaptured === 'boolean') row.email_captured = emailCaptured;
  if (featurePriority) row.feature_priority = featurePriority;
  if (experienceRating) row.experience_rating = experienceRating;
  if (inferredTopic) row.inferred_topic = inferredTopic;

  return safeUpsert(TABLES.chatSessions, row, 'chat_session_id');
}

export async function updateChatSession(chatSessionId, updates = {}) {
  if (!chatSessionId || !updates || Object.keys(updates).length === 0) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from(TABLES.chatSessions)
    .update(updates)
    .eq('chat_session_id', chatSessionId)
    .select();

  if (error) {
    console.error(`Update failed for ${TABLES.chatSessions}:`, error);
  }

  return { data, error };
}

export async function markChatEmailCaptured(chatSessionId, updates = {}) {
  return updateChatSession(chatSessionId, {
    email_captured: true,
    ...updates
  });
}

export async function getNextMessageOrder(chatSessionId) {
  if (!chatSessionId) return 1;

  const { data, error } = await supabase
    .from(TABLES.chatMessages)
    .select('message_order')
    .eq('chat_session_id', chatSessionId)
    .order('message_order', { ascending: false })
    .limit(1);

  if (error) {
    console.error(`Read failed for ${TABLES.chatMessages}:`, error);
    return 1;
  }

  return (data?.[0]?.message_order || 0) + 1;
}

export async function getChatHistory(chatSessionId) {
  if (!chatSessionId) return [];

  const { data, error } = await supabase
    .from(TABLES.chatMessages)
    .select('role, message_text, message_order, created_at')
    .eq('chat_session_id', chatSessionId)
    .order('message_order', { ascending: true });

  if (error) {
    console.error(`Read failed for ${TABLES.chatMessages}:`, error);
    return [];
  }

  return data || [];
}

export async function saveChatMessage({
  chatSessionId,
  role,
  messageText,
  messageOrder,
  createdAt
}) {
  if (!chatSessionId || !role || !messageText) {
    return { data: null, error: new Error('Missing chat message fields') };
  }

  return safeInsert(TABLES.chatMessages, {
    chat_session_id: chatSessionId,
    role,
    message_text: messageText,
    message_order: messageOrder,
    created_at: createdAt || nowIso()
  });
}
