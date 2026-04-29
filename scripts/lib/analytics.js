window.FrenchiePal = window.FrenchiePal || {};

window.FrenchiePal.createAnalytics = function createAnalytics(sessionContext) {
    function buildPayload(eventName, options = {}) {
        const currentSession = window.FrenchiePal.getSessionContext();
        const reservedKeys = new Set([
            'sourceSection',
            'metadata',
            'endedAt',
            'leadCaptured',
            'keepalive'
        ]);
        const legacyMetadata = Object.keys(options).reduce((acc, key) => {
            if (!reservedKeys.has(key)) {
                acc[key] = options[key];
            }
            return acc;
        }, {});
        const metadata = {
            ...legacyMetadata,
            ...(options.metadata || {})
        };

        return {
            session_id: currentSession.session_id,
            event_name: eventName,
            source_section: options.sourceSection || null,
            device_type: window.FrenchiePal.getDeviceType(),
            landing_version: currentSession.landing_version,
            started_at: currentSession.started_at,
            ended_at: options.endedAt || null,
            lead_captured:
                typeof options.leadCaptured === 'boolean'
                    ? options.leadCaptured
                    : currentSession.lead_captured,
            metadata
        };
    }

    async function trackEvent(eventName, options = {}) {
        try {
            await fetch('/api/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildPayload(eventName, options)),
                keepalive: Boolean(options.keepalive)
            });
        } catch (e) {
            console.error('trackEvent error', e);
        }
    }

    function trackChatOpenOnce(location) {
        const alreadyTracked = sessionStorage.getItem('fp_assistant_clicked_v2');
        if (alreadyTracked === '1') return;

        sessionStorage.setItem('fp_assistant_clicked_v2', '1');
    }

    function trackSessionEnd() {
        const currentSession = window.FrenchiePal.getSessionContext();
        const payload = buildPayload('session_end', {
            sourceSection: 'landing',
            endedAt: new Date().toISOString(),
            keepalive: true
        });

        try {
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], {
                    type: 'application/json'
                });
                navigator.sendBeacon('/api/event', blob);
                return;
            }
        } catch (e) {
            console.error('sendBeacon error', e);
        }

        trackEvent('session_end', {
            sourceSection: 'landing',
            endedAt: new Date().toISOString(),
            leadCaptured: currentSession.lead_captured,
            keepalive: true
        });
    }

    function initSessionTracking() {
        trackEvent('page_view', {
            sourceSection: 'hero',
            metadata: {
                funnel_version: 'v2'
            }
        });

        window.addEventListener('pagehide', trackSessionEnd);
        window.addEventListener('beforeunload', trackSessionEnd);
    }

    return {
        initSessionTracking,
        trackEvent,
        trackChatOpenOnce
    };
};
