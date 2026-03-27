window.FrenchiePal = window.FrenchiePal || {};

window.FrenchiePal.getSessionId = function getSessionId() {
    let sessionId = sessionStorage.getItem('fp_session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('fp_session_id', sessionId);
    }
    return sessionId;
};
