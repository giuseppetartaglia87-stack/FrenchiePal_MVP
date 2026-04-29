window.FrenchiePal = window.FrenchiePal || {};

const LANDING_SESSION_KEY = 'fp_session_ctx_v2';
const CHAT_SESSION_KEY = 'fp_chat_session_ctx_v2';
const LANDING_VERSION = 'v2';

function getCurrentDeviceType() {
    return window.matchMedia('(max-width: 1023px)').matches ? 'mobile' : 'desktop';
}

function readJson(key) {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function writeJson(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
    return value;
}

window.FrenchiePal.getDeviceType = getCurrentDeviceType;

window.FrenchiePal.getSessionContext = function getSessionContext() {
    const existing = readJson(LANDING_SESSION_KEY);

    if (existing?.session_id) {
        existing.device_type = getCurrentDeviceType();
        existing.landing_version = LANDING_VERSION;
        return writeJson(LANDING_SESSION_KEY, existing);
    }

    return writeJson(LANDING_SESSION_KEY, {
        session_id: crypto.randomUUID(),
        landing_version: LANDING_VERSION,
        device_type: getCurrentDeviceType(),
        started_at: new Date().toISOString(),
        lead_captured: false
    });
};

window.FrenchiePal.getSessionId = function getSessionId() {
    return window.FrenchiePal.getSessionContext().session_id;
};

window.FrenchiePal.markSessionLeadCaptured = function markSessionLeadCaptured() {
    const session = window.FrenchiePal.getSessionContext();
    session.lead_captured = true;
    return writeJson(LANDING_SESSION_KEY, session);
};

window.FrenchiePal.getChatSessionContext = function getChatSessionContext() {
    const session = window.FrenchiePal.getSessionContext();
    const existing = readJson(CHAT_SESSION_KEY);

    if (existing?.chat_session_id) {
        existing.session_id = session.session_id;
        existing.device_type = getCurrentDeviceType();
        return writeJson(CHAT_SESSION_KEY, existing);
    }

    return writeJson(CHAT_SESSION_KEY, {
        chat_session_id: crypto.randomUUID(),
        session_id: session.session_id,
        device_type: getCurrentDeviceType(),
        started_at: new Date().toISOString(),
        entry_point: 'assistant'
    });
};

window.FrenchiePal.getLandingVersion = function getLandingVersion() {
    return LANDING_VERSION;
};
