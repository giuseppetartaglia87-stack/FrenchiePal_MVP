
/* ===== lib/session.js ===== */
window.FrenchiePal = window.FrenchiePal || {};

const LANDING_SESSION_KEY = 'fp_session_ctx_v4';
const CHAT_SESSION_KEY = 'fp_chat_session_ctx_v4';
const LANDING_VERSION = 'v4';

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

window.FrenchiePal.createContextChatSession = function createContextChatSession(contextKey) {
    const session = window.FrenchiePal.getSessionContext();
    return {
        chat_session_id: crypto.randomUUID(),
        session_id: session.session_id,
        device_type: getCurrentDeviceType(),
        started_at: new Date().toISOString(),
        entry_point: `context:${String(contextKey || 'home')}`
    };
};


/* ===== lib/analytics.js ===== */
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
        const alreadyTracked = sessionStorage.getItem('fp_assistant_clicked_v4');
        if (alreadyTracked === '1') return;

        sessionStorage.setItem('fp_assistant_clicked_v4', '1');
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
                funnel_version: 'v4'
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


/* ===== features/nav.js ===== */
window.FrenchiePal = window.FrenchiePal || {};

window.FrenchiePal.initSectionNav = function initSectionNav() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });
};


/* ===== features/demo.js ===== */
window.FrenchiePal = window.FrenchiePal || {};

window.FrenchiePal.createDemoController = function createDemoController({
    trackEvent,
    trackChatOpenOnce
}) {
    const phoneFrame = document.getElementById('phone-frame');
    const screenHome = document.getElementById('screen-home');
    const screenHealth = document.getElementById('screen-health');
    const screenDash = document.getElementById('screen-dashboard');
    const screenChat = document.getElementById('screen-chat');
    const demoTabButtons = document.querySelectorAll('[data-demo-tab]');

    const statusText = document.getElementById('phone-status-text');
    const phoneExitLabel = document.getElementById('phone-exit-label');

    let isDemoFullscreen = false;
    let lockedScrollY = 0;
    let initialHomeTracked = false;

    const TAB_CONFIG = {
        home: {
            screen: screenHome,
            analyticsTab: 'home'
        },
        health: {
            screen: screenHealth,
            analyticsTab: 'health'
        },
        dash: {
            screen: screenDash,
            analyticsTab: 'alert'
        },
        chat: {
            screen: screenChat,
            analyticsTab: 'assistant'
        }
    };

    function isMobileViewport() {
        return window.matchMedia('(max-width: 1023px)').matches;
    }

    function updateExitLabel() {
        if (phoneExitLabel) {
            phoneExitLabel.textContent = 'Home';
        }
    }

    function blurActiveElement() {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    }

    function normalizeTab(tab) {
        if (tab === 'alerts') return 'dash';
        return tab;
    }

    function trackDemoTabView(tab, source = 'click') {
        const normalizedTab = normalizeTab(tab);
        const config = TAB_CONFIG[normalizedTab];
        if (!config) return;

        trackEvent('demo_tab_view', {
            sourceSection: isMobileViewport() ? 'hero_mobile_demo' : 'hero_demo',
            metadata: {
                tab: config.analyticsTab,
                source
            }
        });
    }

    function setActiveScreen(screen) {
        const nextScreen = normalizeTab(screen);

        Object.values(TAB_CONFIG).forEach(({ screen: panel }) => {
            if (panel) panel.classList.remove('active');
        });

        const target = TAB_CONFIG[nextScreen]?.screen;
        if (target) target.classList.add('active');

        demoTabButtons.forEach((button) => {
            button.classList.toggle('active', button.dataset.demoTab === nextScreen);
        });

        updateExitLabel();
    }

    function enterDemoFullscreen() {
        if (!phoneFrame || !isMobileViewport() || isDemoFullscreen) return;

        lockedScrollY = window.scrollY;
        document.body.classList.add('demo-fullscreen-lock');
        document.body.style.top = `-${lockedScrollY}px`;
        phoneFrame.classList.add('phone-frame-mobile-fullscreen');
        isDemoFullscreen = true;
        updateExitLabel();

        trackEvent('demo_open_fullscreen', {
            sourceSection: 'hero_mobile_demo',
            metadata: {
                location: 'hero_phone_demo'
            }
        });
    }

    function exitDemoFullscreen() {
        if (!isDemoFullscreen) return;

        blurActiveElement();
        document.body.classList.remove('demo-fullscreen-lock');
        document.body.style.top = '';
        phoneFrame.classList.remove('phone-frame-mobile-fullscreen');
        isDemoFullscreen = false;
        updateExitLabel();

        trackEvent('demo_close_fullscreen', {
            sourceSection: 'hero_mobile_demo',
            metadata: {
                location: 'hero_phone_demo'
            }
        });

        requestAnimationFrame(() => {
            window.scrollTo(0, lockedScrollY);
        });
    }

    function ensureDemoVisibility(screen) {
        if (isMobileViewport()) enterDemoFullscreen();
        setActiveScreen(screen);
    }

    function toggleMobileChat(forceState) {
        if (!isMobileViewport()) return;

        const shouldOpen = typeof forceState === 'boolean' ? forceState : !isDemoFullscreen;

        if (shouldOpen) {
            enterDemoFullscreen();
            setActiveScreen('home');

            if (!initialHomeTracked) {
                initialHomeTracked = true;
                trackDemoTabView('home', 'fullscreen_open');
            }
            return;
        }

        setActiveScreen('home');
        exitDemoFullscreen();
    }

    function openDemoExperience(screen, location) {
        const normalizedScreen = normalizeTab(screen);
        ensureDemoVisibility(normalizedScreen);

        if (!initialHomeTracked) {
            initialHomeTracked = true;
            trackDemoTabView('home', location || 'demo_open');
        }

        if (normalizedScreen === 'chat') {
            trackChatOpenOnce(location || 'launcher_chat');
        }

        if (normalizedScreen && TAB_CONFIG[normalizedScreen]) {
            trackDemoTabView(normalizedScreen, location || 'open_demo_experience');
        }
    }

    function returnToDemoHome() {
        setActiveScreen('home');
        trackDemoTabView('home', 'return_home');
    }

    function switchTab(tab) {
        const normalizedTab = normalizeTab(tab);
        ensureDemoVisibility(normalizedTab);
        trackDemoTabView(normalizedTab, 'tab_click');

        if (normalizedTab === 'chat') {
            trackChatOpenOnce('phone_tab');
        }
    }

    function init() {
        window.addEventListener('resize', () => {
            if (!isMobileViewport() && isDemoFullscreen) {
                exitDemoFullscreen();
            }
        });

        setActiveScreen('home');

        if (!initialHomeTracked) {
            initialHomeTracked = true;
            trackDemoTabView('home', 'initial_view');
        }
    }

    return {
        ensureDemoVisibility,
        openDemoExperience,
        returnToDemoHome,
        switchTab,
        toggleMobileChat,
        init
    };
};


/* ===== features/chat.js ===== */
window.FrenchiePal = window.FrenchiePal || {};

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

window.FrenchiePal.createChatController = function createChatController({
    trackEvent,
    trackChatOpenOnce,
    demoController,
    sessionContext
}) {
    const chatInputPhone = document.getElementById('phone-chat-input');
    const chatLog = document.getElementById('phone-chat-log');
    const suggestedQuestions = document.getElementById('chat-suggested-questions');

    let firstMessageTracked = false;

    function getChatSessionContext() {
        return window.FrenchiePal.getChatSessionContext();
    }

    function ensureFirstMessageTracked(source) {
        if (firstMessageTracked) return;
        firstMessageTracked = true;

        trackEvent('assistant_first_message', {
            sourceSection: 'assistant',
            metadata: {
                source
            }
        });
    }

    function buildFallbackReply(message) {
        const msg = String(message || '').toLowerCase();

        if (msg.includes('caldo') || msg.includes('respiro') || msg.includes('affanno')) {
            return 'Se vedi caldo o affanno, fai pausa, ombra e riduci il movimento. Controlla anche se Enea recupera bene dopo pochi minuti.';
        }

        if (msg.includes('salti') || msg.includes('scale') || msg.includes('schiena') || msg.includes('ernia')) {
            return 'Per la schiena, nei momenti delicati conviene limitare salti, scale e cambi di quota. Meglio ridurre il carico prima che diventi eccessivo.';
        }

        if (msg.includes('pelle') || msg.includes('prurito') || msg.includes('gratta') || msg.includes('pieghe')) {
            return 'Se noti piu grattamento del solito, controlla pieghe, rossori e umidita nelle zone sensibili. Mantieni la zona pulita e asciutta.';
        }

        if (msg.includes('mangiato') || msg.includes('cena') || msg.includes('pasto')) {
            return 'Meglio non forzarlo con una cena più pesante del normale. Tieni il pasto regolare, semplice e osserva appetito ed energia nelle prossime ore.';
        }

        return 'Questa e una risposta demo locale: posso darti consigli base su routine, respiro, schiena e pelle del Frenchie.';
    }

    function hideSuggestedQuestions() {
        if (suggestedQuestions) {
            suggestedQuestions.remove();
        }
    }

    function addChatBubble(text, sender, isTyping = false) {
        const div = document.createElement('div');

        if (sender === 'user') {
            div.className = 'flex justify-end';
            div.innerHTML = `
                <div class="chat-bubble-user max-w-[85%] rounded-full bg-[#7d9468] px-3 py-2 text-[0.66rem] leading-relaxed text-white shadow-sm">
                    ${escapeHtml(text)}
                </div>
            `;
        } else {
            div.className = 'flex flex-col items-start max-w-[90%]';
            if (isTyping) div.setAttribute('data-typing', 'true');
            div.innerHTML = `
                <div class="chat-bubble-bot border border-[#7d9468]/20 rounded-t-lg rounded-br-lg rounded-bl-none p-3 relative overflow-hidden shadow-sm max-w-full bg-[#e7eede] text-[0.72rem] leading-relaxed">
                    ${escapeHtml(text)}
                </div>
            `;
        }

        chatLog.appendChild(div);
        requestAnimationFrame(() => {
            chatLog.scrollTop = chatLog.scrollHeight;
        });
    }

    function removeTypingBubble() {
        const typingBubble = chatLog.querySelector('[data-typing="true"]');
        if (typingBubble) typingBubble.remove();
    }

    async function sendChatMessage(userMsg, source, metadata = {}) {
        if (!userMsg) return;

        hideSuggestedQuestions();
        trackChatOpenOnce(source === 'phone_suggested' ? 'suggested_question' : source);
        demoController.ensureDemoVisibility('chat');

        trackEvent('assistant_message_send', {
            sourceSection: 'assistant',
            metadata: {
                source,
                ...metadata
            }
        });

        ensureFirstMessageTracked(source);

        const chatSession = getChatSessionContext();
        addChatBubble(userMsg, 'user');
        addChatBubble('Sto pensando...', 'bot', true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionContext.session_id,
                    chat_session_id: chatSession.chat_session_id,
                    device_type: window.FrenchiePal.getDeviceType(),
                    landing_version: sessionContext.landing_version,
                    started_at: sessionContext.started_at,
                    chat_started_at: chatSession.started_at,
                    source_section: 'assistant',
                    message_source: source,
                    message: userMsg
                })
            });

            const data = await res.json().catch(() => ({}));
            removeTypingBubble();

            if (!res.ok) {
                addChatBubble(data.error || buildFallbackReply(userMsg), 'bot');
                return;
            }

            if (/@/.test(userMsg)) {
                window.FrenchiePal.markSessionLeadCaptured();
            }

            addChatBubble(data.reply, 'bot');
        } catch (e) {
            removeTypingBubble();
            addChatBubble(buildFallbackReply(userMsg), 'bot');
        }
    }

    async function triggerChat(source) {
        const userMsg = chatInputPhone.value.trim();
        chatInputPhone.value = '';

        if (!userMsg) return;
        await sendChatMessage(userMsg, source || 'phone_input');
    }

    async function sendSuggestedQuestion(message) {
        const question = String(message || '').trim();
        if (!question) return;

        trackEvent('assistant_suggested_question_click', {
            sourceSection: 'assistant',
            metadata: {
                question
            }
        });

        await sendChatMessage(question, 'phone_suggested', {
            suggested: true,
            question
        });
    }

    function init() {
        chatInputPhone?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerChat('phone_input');
            }
        });

        document.addEventListener('frenchiepal:chat-opened', () => {
            if (chatLog && suggestedQuestions && document.body.clientWidth < 1024) {
                chatLog.scrollTop = 0;
            }
        });
    }

    return {
        sendSuggestedQuestion,
        triggerChat,
        init
    };
};

/* ===== features/waitlist.js ===== */
window.FrenchiePal = window.FrenchiePal || {};

window.FrenchiePal.createWaitlistController = function createWaitlistController({
    sessionContext,
    trackEvent
}) {
    let waitlistStartedTracked = false;

    function trackWaitlistStart(source = 'form_focus') {
        if (waitlistStartedTracked) return;
        waitlistStartedTracked = true;

        trackEvent('waitlist_form_start', {
            sourceSection: 'waitlist',
            metadata: {
                source
            }
        });
    }

    async function submitLeadForm() {
        const email = document.getElementById('email-input')?.value || '';
        const dogAge = document.getElementById('dog-age-input')?.value || '';
        const priority = document.getElementById('priority-input')?.value || '';
        const success = document.getElementById('form-success');

        trackEvent('waitlist_submit', {
            sourceSection: 'waitlist',
            metadata: {
                dog_age: dogAge,
                priority
            }
        });

        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    dog_age: dogAge,
                    priority,
                    session_id: sessionContext.session_id,
                    device_type: window.FrenchiePal.getDeviceType(),
                    landing_version: sessionContext.landing_version,
                    started_at: sessionContext.started_at
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Errore nel salvataggio');
                return;
            }

            trackEvent('lead_captured', {
                sourceSection: 'waitlist',
                metadata: {
                    lead_source: 'form',
                    dog_age: dogAge,
                    priority
                }
            });

            window.FrenchiePal.markSessionLeadCaptured();
            success.classList.remove('hidden');
            success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            document.getElementById('email-input').value = '';
            document.getElementById('dog-age-input').value = '';
            document.getElementById('priority-input').value = '';
        } catch (e) {
            alert('Errore di rete');
        }
    }

    function init() {
        ['email-input', 'dog-age-input', 'priority-input'].forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;

            el.addEventListener('focus', () => trackWaitlistStart('focus'), { once: true });
            el.addEventListener('change', () => trackWaitlistStart('change'), { once: true });
        });
    }

    return {
        submitLeadForm,
        init
    };
};

/* ===== app.js ===== */
window.FrenchiePal = window.FrenchiePal || {};

(function bootstrapFrenchiePal() {
    const sessionContext = window.FrenchiePal.getSessionContext();
    const analytics = window.FrenchiePal.createAnalytics(sessionContext);
    const trackEvent = analytics.trackEvent;
    const trackChatOpenOnce = analytics.trackChatOpenOnce;

    analytics.initSessionTracking();
    window.FrenchiePal.initSectionNav();

    const demoController = window.FrenchiePal.createDemoController({
        trackEvent,
        trackChatOpenOnce
    });

    const chatController = window.FrenchiePal.createChatController({
        trackEvent,
        trackChatOpenOnce,
        demoController,
        sessionContext
    });

    const waitlistController = window.FrenchiePal.createWaitlistController({
        sessionContext,
        trackEvent
    });

    demoController.init();
    chatController.init();
    waitlistController.init();

    window.openDemoExperience = demoController.openDemoExperience;
    window.toggleMobileChat = demoController.toggleMobileChat;
    window.returnToDemoHome = demoController.returnToDemoHome;
    window.switchTab = demoController.switchTab;

    // Mantengo queste export solo se nel markup o in altri file ci sono ancora riferimenti legacy.
    if (typeof demoController.triggerAlert === 'function') {
        window.triggerAlert = demoController.triggerAlert;
    }
    if (typeof demoController.setAlertScenario === 'function') {
        window.setAlertScenario = demoController.setAlertScenario;
    }
    if (typeof demoController.resetAlerts === 'function') {
        window.resetAlerts = demoController.resetAlerts;
    }

    window.triggerChat = chatController.triggerChat;
    window.sendSuggestedQuestion = chatController.sendSuggestedQuestion;
    window.submitLeadForm = waitlistController.submitLeadForm;
    window.trackEvent = trackEvent;
})();
