window.FrenchiePal = window.FrenchiePal || {};

window.FrenchiePal.createAnalytics = function createAnalytics(sessionId) {
    async function trackEvent(eventName, eventData = {}) {
        try {
            await fetch('/api/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    event_name: eventName,
                    event_data: eventData
                })
            });
        } catch (e) {
            console.error('trackEvent error', e);
        }
    }

    function trackChatOpenOnce(location) {
        const alreadyTracked = sessionStorage.getItem('fp_chat_opened');
        if (alreadyTracked === '1') return;

        sessionStorage.setItem('fp_chat_opened', '1');
        trackEvent('chat_open', { location });
    }

    return {
        trackEvent,
        trackChatOpenOnce
    };
};
