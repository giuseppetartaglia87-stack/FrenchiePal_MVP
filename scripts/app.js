/* FrenchiePal v4 - frontend consolidato. Modificare index.html per i contenuti e styles/main.css per la grafica. */

/* ===== scripts/bundle.js ===== */
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

/* ===== scripts/ui.js ===== */
/* Navigazione di base delle schermate demo. */
(function(){
            function fit(){ var f=document.getElementById('phone-frame'); if(!f) return; var w=f.clientWidth; if(w>0) f.style.setProperty('--app-scale',(w/340).toFixed(4)); }
            var f=document.getElementById('phone-frame');
            if(f){ fit(); window.addEventListener('resize',fit); if(window.ResizeObserver){ new ResizeObserver(fit).observe(f); } if(document.fonts&&document.fonts.ready){ document.fonts.ready.then(fit); } }
            window.openSubScreen=function(id){ var fr=document.getElementById('phone-frame'); if(!fr) return; fr.querySelectorAll('.phone-screen').forEach(function(s){ s.classList.remove('active'); }); var t=document.getElementById(id); if(t){ t.classList.add('active'); var sc=t.querySelector('.fp-scroll'); if(sc) sc.scrollTop=0; } };
            window.fpBack=function(back){ var fr=document.getElementById('phone-frame'); if(!fr) return; fr.querySelectorAll('.phone-screen').forEach(function(s){ s.classList.remove('active'); }); if(back && typeof window.switchTab==='function'){ window.switchTab(back); } else { var hm=document.getElementById('screen-home'); if(hm) hm.classList.add('active'); } };
            window.fpTab=function(tab){ var fr=document.getElementById('phone-frame'); if(fr) fr.querySelectorAll('.phone-screen').forEach(function(s){ s.classList.remove('active'); }); if(typeof window.switchTab==='function') window.switchTab(tab); };

            
})();

/* Tab, FAB assistente e pulsanti di aggiunta. */
(function(){
      var CTX={
        'screen-home':'home','screen-health':'health','screen-dashboard':'dash',
        'screen-activities':'activities','screen-profile':'profile','screen-places':'places',
        'screen-m-activity':'m-activity','screen-m-temp':'m-temp','screen-m-resp':'m-resp','screen-m-energy':'m-energy',
        'screen-diary':'diary','screen-records':'records',
        'screen-alert-activity':'alert-activity','screen-alert-resp':'alert-resp','screen-alert-skin':'alert-skin',
        'screen-place-hazard':'place-hazard','screen-place-park':'place-park',
        'screen-place-owners':'place-owners','screen-place-vet':'place-vet','screen-place-add':'place-add'
      };
      function setup(){
        var frame=document.getElementById('phone-frame');
        if(!frame) return;
        var mapCredit=frame.querySelector('.places-credit');
        if(mapCredit){
          mapCredit.innerHTML='<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a> · demo';
        }
        /* 1. rimuovi la tab "Assistente" da tutte le footer -> barra a 3 voci */
        frame.querySelectorAll('.fp-footer .fp-tab').forEach(function(btn){
          var oc=btn.getAttribute('onclick')||'';
          if(btn.getAttribute('data-demo-tab')==='chat' || oc.indexOf("'chat'")>-1) btn.remove();
        });
        /* 1b. tab "Luoghi" + ordine barra: Home · Alert · Luoghi · Salute */
        frame.querySelectorAll('.fp-footer').forEach(function(ft){
          if(!ft.querySelector('[data-tab="places"]')){
            var b=document.createElement('button');
            b.type='button'; b.className='fp-tab'; b.setAttribute('data-tab','places');
            b.innerHTML='<span class="fp-tab-ic"><span class="material-symbols-outlined">map</span></span><span class="fp-tab-lbl">Luoghi</span>';
            b.addEventListener('click',function(){ window.fpGo('places'); });
            ft.appendChild(b);
          }
          function byLbl(t){ return [].slice.call(ft.querySelectorAll('.fp-tab')).find(function(x){ var l=x.querySelector('.fp-tab-lbl'); return l && l.textContent.trim()===t; }); }
          ['Home','Salute','Luoghi','Alert'].forEach(function(t){ var x=byLbl(t); if(x) ft.appendChild(x); });
        });
        /* 2. rimuovi i pulsanti "Chiedi all'assist." in-content (ora ridondanti col FAB) */
        frame.querySelectorAll('.fp-asbtn').forEach(function(b){ var p=b.parentElement; (p||b).remove(); });
        /* 3. inietta il FAB su ogni schermata (tranne l'assistente stesso) */
        frame.querySelectorAll('.phone-screen').forEach(function(scr){
          var key=CTX[scr.id]; if(!key) return;
          var canvas=scr.querySelector('.fp-canvas'); if(!canvas) return;
          var fab=document.createElement('button');
          fab.type='button'; fab.className='fp-fab'; fab.setAttribute('aria-label','Chiedi all\u2019assistente');
          fab.innerHTML='<span class="material-symbols-outlined">volunteer_activism</span><span class="fp-fab-lbl">Chiedi all\u2019assist.</span>';
          fab.addEventListener('click',function(){ if(typeof window.openAssistant==='function') window.openAssistant(key); });
          canvas.appendChild(fab);
          var sc=scr.querySelector('.fp-scroll') || scr.querySelector('.places-sheet');
          if(sc){
            if(sc.classList.contains('fp-scroll')) sc.style.paddingBottom='82px';
            sc.addEventListener('scroll',function(){
              if(sc.scrollTop>8) fab.classList.add('fp-fab--mini'); else fab.classList.remove('fp-fab--mini');
            },{passive:true});
          }
        });
        /* 3b. pulsante "+" flottante sopra il FAB assistente, sulle schede con azione di aggiunta */
        var ADD={
          'screen-activities':null,
          'screen-diary':null,
          'screen-records':null,
          'screen-places':function(){ if(typeof window.openSubScreen==='function') window.openSubScreen('screen-place-add'); }
        };
        frame.querySelectorAll('.phone-screen').forEach(function(scr){
          if(!(scr.id in ADD)) return;
          var canvas=scr.querySelector('.fp-canvas'); if(!canvas) return;
          if(canvas.querySelector('.fp-add-fab')) return;
          var add=document.createElement('button');
          add.type='button'; add.className='fp-add-fab'; add.setAttribute('aria-label','Aggiungi');
          add.innerHTML='<span class="material-symbols-outlined">add</span>';
          if(ADD[scr.id]) add.addEventListener('click',ADD[scr.id]);
          canvas.appendChild(add);
        });
      }
      if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup); else setup();

})();

/* ===== scripts/assistant-contexts.js ===== */
/* Testi, suggerimenti e fallback visuali dell'assistente. */
window.FrenchiePalAssistantContexts = {
              "places":{ctx:"Luoghi · Mappa del quartiere",data:"sezione Luoghi: mappa con altri proprietari di Frenchie (posizione approssimata), aree cani/parchi, veterinari e segnalazioni di pericoli; vicino a Enea: vetri rotti Via Verdi a 90m, area cani Parco Sempione a 350m (recintata, acqua, ombra), 3 proprietari zona Via Dante a 420m, ambulatorio Dr. Bianchi a 600m; oggi 22° con punte 27 (attenzione caldo); Enea ha sensibilità alla schiena, evitare salti e sforzi intensi",greeting:"Sto guardando i Luoghi vicino a te. Posso aiutarti a scegliere dove portare Enea oggi o a evitare i punti critici. Cosa ti serve?",q:[
                {t:"Qual è il posto migliore adesso?",a:"Con i 22° di oggi l'area cani del Parco Sempione (350 m) è una buona scelta: è recintata, ha ombra e acqua. Vai nelle ore meno calde e porta comunque una borraccia per Enea."},
                {t:"Ci sono pericoli sul percorso?",a:"Sì: a 90 m, in Via Verdi, è segnalata la presenza di vetri rotti sul marciapiede. Tieni Enea al guinzaglio corto in quel tratto o scegli un percorso alternativo."},
                {t:"Posso far socializzare Enea?",a:"In zona Via Dante (420 m) ci sono 3 proprietari di Frenchie aperti a conoscersi. Per Enea, che ha la schiena sensibile, meglio gioco tranquillo senza salti o rincorse troppo intense."}],
                fallback:"Dai Luoghi vicini: col caldo di oggi punta su aree ombreggiate e recintate come il Parco Sempione, evita il tratto di Via Verdi segnalato, e per la schiena di Enea preferisci passeggiate tranquille."},
              "health":{ctx:"Salute · Diario e fascicolo",data:"sezione Salute: diario di oggi (pappe, uscite, nota del giorno) e fascicolo sanitario (vaccini, patologie note, terapie, visite); antirabbica in scadenza 23/06; sensibilità cutanea alle pieghe; integratore articolazioni",greeting:"Sto guardando la sezione Salute di Enea: qui ci sono il diario di oggi e il fascicolo sanitario. Su cosa ti aiuto?",q:[
                {t:"Cosa c'è da fare a breve?",a:"L'antirabbica è in scadenza il 23/06/2026: conviene prenotare il richiamo. Per il resto la routine di oggi, tra pappe e uscite, è regolare."},
                {t:"Come tengo aggiornato il diario?",a:"Annota appetito, energia, uscite ed eventuali grattamenti o feci diverse dal solito. Col tempo questi dettagli aiutano te e il veterinario a cogliere i cambiamenti."},
                {t:"A cosa serve il fascicolo?",a:"Tiene insieme vaccini, patologie note, terapie e referti: così a ogni visita hai la storia di Enea in un posto solo e i segnali hanno più contesto."}],
                fallback:"Dalla sezione Salute: routine di oggi regolare, l'unica scadenza da segnare è l'antirabbica del 23/06. Tieni aggiornati diario e fascicolo per avere sempre il quadro."},
              "dash":{ctx:"Alert · Riepilogo",data:"3 alert attivi: 1 da gestire (attività elevata, rischio schiena/IVDD) e 2 attenzione (respirazione elevata col caldo; grattamento in aumento sulle pieghe)",greeting:"Sto guardando gli Alert di Enea: 1 da gestire e 2 da tenere d'occhio. Vuoi capire come muoverti?",q:[
                {t:"Da cosa parto?",a:"Dall'alert 'da gestire': l'attività di oggi è stata elevata e sollecita la schiena. Oggi meglio riposo, niente salti né scale, e occhio ai segnali di dolore."},
                {t:"Gli alert 'attenzione' sono gravi?",a:"Non urgenti se rientrano: la respirazione era alta col caldo (riposo al fresco e acqua) e il grattamento è cresciuto (pulisci e asciuga le pieghe). Diventano seri se peggiorano."},
                {t:"Quando chiamo il vet?",a:"Se Enea trascina le zampe o esita a muoversi, se l'affanno non si placa con il fresco, o se sulle pieghe compaiono rossore, odore o perdita di pelo."}],
                fallback:"Sul quadro Alert: una cosa da gestire (schiena) e due da monitorare (caldo e pelle). Oggi riposo e fresco, igiene delle pieghe, e contatta il vet se qualcosa peggiora."},
              "home":{ctx:"Home · Stato di oggi",data:"stato generale nella norma; attività 10 min, temp esterna 22° (max 27 venerdì), respiro 16 rpm, energia 80%; consiglio del giorno: oggi farà caldo, acqua fresca ed evitare le passeggiate nelle ore di punta",greeting:"Sto guardando la Home di Enea: oggi è tutto nella norma e il consiglio del giorno riguarda il caldo. Come posso aiutarti?",q:[
                {t:"Perché il consiglio sul caldo?",a:"Oggi sono previsti 22°, con punte fino a 27°: per un Frenchie il caldo è impegnativo per via del muso corto. Per questo conviene acqua sempre fresca ed evitare le uscite nelle ore centrali."},
                {t:"Com'è la giornata di Enea?",a:"Quadro nella norma: attività 10 min, respiro 16 rpm a riposo ed energia all'80%. Nessun valore fuori soglia oggi, puoi gestire la routine con tranquillità."},
                {t:"Cosa controllo oggi?",a:"Con il caldo, tieni d'occhio il respiro durante e dopo le uscite, offri acqua spesso e preferisci ombra ed erba. Per il resto la giornata è regolare."}],
                fallback:"Dalla Home: oggi tutto nella norma, l'unico accorgimento è il caldo. Acqua fresca, ombra ed evita le ore di punta; segnala al vet eventuali cambiamenti."},
              "m-activity":{ctx:"Attività · questa settimana",data:"attività intensa oggi 10 min; media settimana 11 min; min 6, max 18; picco sabato; soglia ideale 5-15 min al giorno",greeting:"Sto guardando l'attività di Enea di questa settimana: oggi 10 min, media 11', con un picco sabato a 18'. Su cosa ti aiuto?",q:[
                {t:"Sabato a 18' è troppo?",a:"18 minuti in un giorno isolato non sono un problema, ma sono oltre la fascia ideale (5–15'). L'importante è che non diventi la norma: alterna giornate intense a giornate più tranquille per non caricare la schiena."},
                {t:"Quanto movimento al giorno?",a:"Per un Frenchie adulto come Enea bastano 2 brevi uscite e un po' di gioco: circa 10–15 min di attività intensa al giorno. Meglio poco e spesso che un'unica sessione lunga."},
                {t:"Come proteggo la schiena?",a:"Evita salti dal divano e scale ripetute, usa una rampa se puoi, e tieni d'occhio le giornate sopra soglia. Se noti rigidità o esitazione nei movimenti, parlane col veterinario."}],
                fallback:"Guardando l'attività di questa settimana il quadro è nella norma: l'unico picco è sabato. Tieni un ritmo regolare e segnala al vet eventuali segni di fatica."},
              "m-resp":{ctx:"Respiro · questa settimana",data:"respiro a riposo 16 rpm (normale 14-20); media 17; picco 22 venerdì legato al caldo",greeting:"Sto guardando il respiro di Enea: 16 rpm a riposo, nella norma, con un picco a 22 venerdì. Come posso aiutarti?",q:[
                {t:"Il picco di venerdì è preoccupante?",a:"Un picco isolato a 22 rpm in una giornata calda è spiegabile e non allarmante di per sé. Diventa importante se si ripete a riposo o se vedi gengive bluastre o affanno marcato: in quel caso senti subito il veterinario."},
                {t:"Quando il respiro è troppo alto?",a:"A riposo, oltre 30 rpm in modo costante è un segnale da non ignorare nei Bulldog Francesi. I 22 di venerdì erano legati al caldo e allo sforzo, non al riposo."},
                {t:"Cosa faccio col caldo?",a:"Esci nelle ore fresche, porta acqua, fai pause all'ombra ed evita lo sforzo intenso. Se ansima molto e non si calma col riposo al fresco, trattalo come un'urgenza."}],
                fallback:"Sul respiro di questa settimana: valori a riposo nella norma, solo il picco di venerdì col caldo. Tienilo d'occhio nelle ore calde e contatta il vet se l'affanno persiste."},
              "m-temp":{ctx:"Temperatura esterna · questa settimana",data:"temp esterna oggi 22°; min 14, media 20, max 27 venerdì; rischio sopra 25°",greeting:"Sto guardando la temperatura esterna: oggi 22°, con un massimo di 27° venerdì. Cosa vuoi sapere?",q:[
                {t:"27° sono pericolosi?",a:"Per un Frenchie sì, sono a rischio: sopra i 25° il pericolo di affanno e colpo di calore cresce molto, per via del muso corto. Venerdì meglio evitare uscite e sforzi nelle ore centrali."},
                {t:"Quando evitare le uscite?",a:"Nelle giornate sopra i 25° evita la fascia 11–18. Preferisci mattino presto e sera, su erba o all'ombra, mai sull'asfalto caldo."},
                {t:"Segnali di colpo di calore?",a:"Ansimare intenso, lingua molto rossa, bava densa, debolezza o barcollamento. È un'emergenza: porta Enea al fresco, bagnalo con acqua tiepida e chiama subito il veterinario."}],
                fallback:"Sulla temperatura: oggi 22° è gestibile, ma venerdì a 27° serviva prudenza. Programma le uscite nelle ore fresche quando supera i 25°."},
              "m-energy":{ctx:"Energia · questa settimana",data:"energia oggi 80% (molto buona); min 52, media 72, max 88; calo sabato dopo lo sforzo",greeting:"Sto guardando l'energia di Enea: oggi all'80%, molto buona, con un calo sabato. Su cosa ti aiuto?",q:[
                {t:"Il calo di sabato è normale?",a:"Sì: sabato c'è stato il picco di attività, quindi un po' di stanchezza il giorno dopo è fisiologica. Oggi è già risalito all'80%, nessun problema."},
                {t:"Come miglioro l'energia?",a:"Sonno regolare, pasti costanti, movimento moderato e niente caldo eccessivo. L'energia è uno specchio di riposo e routine: mantienili stabili."},
                {t:"Quando preoccuparmi?",a:"Se l'energia resta bassa per più giorni senza un motivo come lo sforzo di sabato, o se si accompagna a inappetenza, è il caso di sentire il veterinario."}],
                fallback:"Sull'energia: trend buono, il calo di sabato è legato allo sforzo ed è già rientrato. Tieni la routine stabile e segnala cali prolungati al vet."},
              "alert-activity":{ctx:"Alert · Attività elevata (schiena)",data:"alert Da gestire: attività elevata oggi 22 min (sopra soglia 5-15); rischio schiena/IVDD da salti e scale",greeting:"Sto guardando l'alert 'Attività elevata' di oggi: 22 min di attività intensa, con possibile stress sulla schiena. Come ti aiuto?",q:[
                {t:"Cosa rischia la schiena?",a:"Nei Frenchie il rischio è l'ernia del disco (IVDD): salti e scale ripetuti, soprattutto dopo attività intensa, sollecitano la colonna. Oggi conviene farlo riposare ed evitare i salti."},
                {t:"Posso ancora farlo uscire?",a:"Sì, ma solo passeggiate brevi e tranquille, senza corsa, salti o giochi intensi. L'obiettivo è far smaltire la giornata intensa senza altri carichi."},
                {t:"Quando chiamare il vet?",a:"Se trascina le zampe, esita a muoversi, piange quando lo sollevi o tiene la schiena curva: sono segnali da far valutare subito."}],
                fallback:"Su questo alert: l'attività di oggi è stata sopra soglia. Riposo, niente salti o scale e occhio ai segnali di dolore alla schiena; se compaiono, contatta il vet."},
              "alert-resp":{ctx:"Alert · Respirazione elevata (caldo)",data:"alert Attenzione: respirazione elevata 22 rpm nelle ore calde; rischio affanno",greeting:"Sto guardando l'alert 'Respirazione elevata': 22 rpm durante le ore calde. Cosa vuoi sapere?",q:[
                {t:"È un'emergenza?",a:"Non ancora, se si calma con riposo al fresco e acqua. Diventa emergenza se l'affanno è marcato, la lingua è molto rossa o bluastra o non si riprende: in quel caso vai subito dal veterinario."},
                {t:"Come lo rinfresco?",a:"Portalo in un luogo fresco e ombreggiato, offri acqua fresca (non ghiacciata), puoi bagnare zampe e pancia con acqua tiepida. Evita ulteriore sforzo."},
                {t:"Segnali da non ignorare?",a:"Affanno che non si placa, gengive bluastre, bava densa, debolezza. Per i Frenchie il caldo è serio: meglio prevenire con uscite nelle ore fresche."}],
                fallback:"Su questo alert: il picco di respiro è legato al caldo. Fai riposare al fresco con acqua ed evita le ore calde; se l'affanno non rientra, è un'urgenza."},
              "alert-skin":{ctx:"Alert · Grattamento in aumento",data:"alert Attenzione: grattamento +40% sulla media; pieghe del muso; rischio dermatite o allergia",greeting:"Sto guardando l'alert 'Grattamento in aumento': +40% rispetto alla media. Come ti aiuto?",q:[
                {t:"Come pulisco le pieghe?",a:"Pulisci le pieghe del muso con una salvietta delicata o garza umida, poi asciuga bene (l'umidità è il problema principale). Rendilo un'abitudine quotidiana."},
                {t:"Serve il veterinario?",a:"Se compaiono rossore marcato, cattivo odore, perdita di pelo o ferite, sì: potrebbe esserci un'infezione o una dermatite da trattare. Un grattamento lieve e occasionale si gestisce a casa."},
                {t:"Può essere allergia?",a:"Sì, i Frenchie sono predisposti ad allergie, alimentari o ambientali. Se il grattamento persiste nonostante l'igiene, vale la pena indagare col veterinario."}],
                fallback:"Su questo alert: il grattamento è cresciuto. Pulisci e asciuga bene le pieghe e monitora; se compaiono rossori, odore o perdita di pelo, senti il veterinario."},
              "diary":{ctx:"Salute · Diario di oggi",data:"diario oggi: pappa mattina fatta 80g, pappa sera 20:00 programmata; passeggiata mattina 15 min fatta, serale 18:30 programmata; nota: più tranquillo, ha dormito al fresco, nessun grattamento",greeting:"Sto guardando il diario di oggi di Enea: pappe, uscite e la tua nota. Come posso aiutarti?",q:[
                {t:"Ha mangiato abbastanza?",a:"Oggi ha fatto la pappa del mattino (80 g) e la cena è programmata per le 20:00. Per un Frenchie adulto la regolarità conta più della quantità del singolo pasto: se mangia con appetito e mantiene il peso, va bene."},
                {t:"Le uscite di oggi bastano?",a:"Una passeggiata al mattino (15 min) e una serale programmata sono adeguate: per Enea meglio due uscite brevi che una lunga, soprattutto col caldo."},
                {t:"Cosa annoto nel diario?",a:"Annota appetito, energia, eventuali grattamenti o feci diverse dal solito. Sono dettagli che, nel tempo, aiutano te e il veterinario a cogliere i cambiamenti."}],
                fallback:"Dal diario di oggi tutto regolare: pappe e uscite in linea, nota tranquilla. Continua a registrare appetito e comportamento per avere un quadro nel tempo."},
              "records":{ctx:"Salute · Fascicolo sanitario",data:"fascicolo: vaccino polivalente fatto 06/2025 prossimo 06/2026; antirabbica in scadenza 23/06/2026; patologia: sensibilità cutanea pieghe muso; terapia: integratore articolazioni 1 al giorno; ultima visita 02/2026 Dr. Bianchi",greeting:"Sto guardando il fascicolo sanitario di Enea: vaccini, patologie note e terapie. Su cosa ti aiuto?",q:[
                {t:"Quali vaccini sono in scadenza?",a:"L'antirabbica è in scadenza il 23/06/2026: conviene prenotare il richiamo. La polivalente è a posto fino a 06/2026."},
                {t:"Come gestisco la pelle sensibile?",a:"Per la sensibilità cutanea registrata, tieni pulite e asciutte le pieghe del muso ogni giorno e monitora i rossori. Se peggiora, falla vedere al veterinario."},
                {t:"A cosa serve l'integratore?",a:"L'integratore per le articolazioni (1 al giorno) supporta la mobilità: utile in una razza soggetta a problemi di schiena. Mantieni la somministrazione costante."}],
                fallback:"Dal fascicolo: tieni d'occhio l'antirabbica in scadenza (23/06) e la cura quotidiana delle pieghe. Per dubbi su terapie o vaccini, conferma col veterinario."}
            };

/* ===== scripts/context-assistant.js ===== */
/* Assistente contestuale FrenchiePal v4. Backend: /api/chat. */
(function(){
    var ASSIST=window.FrenchiePalAssistantContexts||{};
            function _esc(s){ var d=document.createElement("div"); d.textContent=s; return d.innerHTML.replace(/\n/g,"<br>"); }
            function _bubble(text,who){ var d=document.createElement("div"); if(who==="user"){ d.className="flex justify-end"; d.innerHTML='<div class="chat-bubble-user">'+text+'</div>'; } else { d.innerHTML='<div class="chat-bubble-bot">'+text+'</div>'; } return d; }
            function _scrollBottom(){ var sc=document.querySelector("#screen-assist-ctx .fp-scroll"); if(sc) sc.scrollTop=sc.scrollHeight; }
            function _aiReply(key,question,curated){ return _aiReplyV4(key,question,curated); }
            window.openAssistant=function(key){ var c=ASSIST[key]; if(!c) return; var act=document.querySelector("#phone-frame .phone-screen.active"); window._assistOrigin=act?act.id:null; window._assistKey=key; window._assistMsgs=[{r:"a",t:c.greeting}]; var b=document.getElementById("assist-ctx-banner"); b.innerHTML='<span class="material-symbols-outlined" style="font-size:19px;color:#5e7350;flex:none;font-variation-settings:&apos;FILL&apos; 1;">insights</span><div><div style="font-size:8px;font-weight:800;letter-spacing:.06em;color:#5e7350;text-transform:uppercase;">Sta assistendo su</div><div style="font-size:12.5px;font-weight:700;color:#3f4a36;">'+c.ctx+'</div></div>'; var log=document.getElementById("assist-ctx-log"); log.innerHTML=""; log.appendChild(_bubble(c.greeting,"bot")); var sg=document.createElement("div"); sg.id="assist-ctx-sugg"; sg.style.cssText="display:flex;flex-direction:column;gap:9px;margin-top:2px;"; c.q.forEach(function(qq,i){ var btn=document.createElement("button"); btn.type="button"; btn.style.cssText="display:flex;align-items:center;gap:10px;border:1px solid #e6dcc8;border-radius:14px;padding:11px 13px;font-size:12px;font-weight:600;color:#574f44;background:#fbf9f4;cursor:pointer;text-align:left;font-family:Nunito,sans-serif;"; btn.innerHTML='<span class="material-symbols-outlined" style="font-size:18px;color:#5e7350;flex:none;">help</span><span>'+qq.t+'</span>'; btn.onclick=(function(idx){return function(){ assistAsk(key,idx); };})(i); sg.appendChild(btn); }); log.appendChild(sg); openSubScreen("screen-assist-ctx"); };
            window.assistAsk=function(key,i){ var c=ASSIST[key]; if(!c) return; var log=document.getElementById("assist-ctx-log"); var sg=document.getElementById("assist-ctx-sugg"); if(sg) sg.remove(); log.appendChild(_bubble(c.q[i].t,"user")); _scrollBottom(); window._assistMsgs=window._assistMsgs||[]; window._assistMsgs.push({r:"u",t:c.q[i].t}); _aiReply(key,c.q[i].t,c.q[i].a); };
            window.assistSend=function(){ var inp=document.getElementById("assist-ctx-input"); var v=(inp.value||"").trim(); if(!v) return; var key=window._assistKey; var c=ASSIST[key]||{}; var log=document.getElementById("assist-ctx-log"); var sg=document.getElementById("assist-ctx-sugg"); if(sg) sg.remove(); log.appendChild(_bubble(v,"user")); inp.value=""; _scrollBottom(); window._assistMsgs=window._assistMsgs||[]; window._assistMsgs.push({r:"u",t:v}); _aiReply(key,v,c.fallback||"Osserva l'andamento e parlane col veterinario se la tendenza continua."); };
            window.assistBack=function(){ if(window._assistOrigin){ openSubScreen(window._assistOrigin); } else { fpBack("dash"); } };

            /* Integrazione v4: OpenAI e contesti validati dal backend Vercel. */
            var EXTRA_ASSIST={
              "profile":{ctx:"Profilo · Dati di Enea",greeting:"Sto guardando il profilo di Enea. Posso aiutarti a interpretare i dati della razza e la sua routine.",q:[{t:"Quali dati sono più importanti?"},{t:"Cosa controllo nella routine?"},{t:"Come proteggo la schiena?"}],fallback:"Nel profilo conviene tenere aggiornati peso, sensibilità note, terapie e contatti veterinari."},
              "activities":{ctx:"Attività · Agenda",greeting:"Sto guardando l'agenda di Enea: pappe, uscite e promemoria. Cosa vuoi organizzare meglio?",q:[{t:"La giornata è ben distribuita?"},{t:"Come gestisco le uscite col caldo?"},{t:"Cosa non devo dimenticare?"}],fallback:"Mantieni pappe e uscite regolari, evitando attività intensa nelle ore più calde."},
              "place-hazard":{ctx:"Luoghi · Segnalazione",greeting:"Sto guardando la segnalazione dei vetri rotti in Via Verdi. Posso aiutarti a scegliere come muoverti.",q:[{t:"Come evito il tratto pericoloso?"},{t:"Cosa controllo alle zampe?"},{t:"La segnalazione è in tempo reale?"}],fallback:"La segnalazione è dimostrativa: nella situazione descritta, scegli un percorso alternativo e controlla le zampe."},
              "place-park":{ctx:"Luoghi · Area cani",greeting:"Sto guardando l'area cani del Parco Sempione nella mappa demo. Vuoi capire se è adatta a Enea?",q:[{t:"È una buona scelta oggi?"},{t:"Come gestisco il caldo?"},{t:"Che giochi sono più sicuri?"}],fallback:"Nella demo l'area è recintata, con acqua e ombra; per Enea meglio attività tranquilla e senza salti."},
              "place-owners":{ctx:"Luoghi · Proprietari vicini",greeting:"Sto guardando i proprietari di Frenchie vicini nella demo. Posso aiutarti a pianificare una socializzazione tranquilla.",q:[{t:"Come faccio un incontro sicuro?"},{t:"Quanto deve durare?"},{t:"Come proteggo la privacy?"}],fallback:"Preferisci un primo incontro breve, in luogo neutro e con posizioni sempre approssimate."},
              "place-vet":{ctx:"Luoghi · Veterinario",greeting:"Sto guardando la scheda del veterinario dimostrativo e il promemoria vaccinale di Enea. Cosa vuoi verificare?",q:[{t:"Cosa devo prenotare?"},{t:"Cosa porto alla visita?"},{t:"Quando è urgente chiamare?"}],fallback:"La scheda ricorda l'antirabbica in scadenza: verifica la data reale e prenota con il tuo veterinario."},
              "place-add":{ctx:"Luoghi · Nuova segnalazione",greeting:"Sto guardando la schermata per aggiungere una segnalazione demo. Posso aiutarti a descriverla in modo utile e rispettoso della privacy.",q:[{t:"Cosa devo scrivere?"},{t:"Quali dati non devo inserire?"},{t:"Come scelgo la categoria?"}],fallback:"Descrivi il rischio in modo breve, senza nomi o indirizzi privati, e scegli la categoria più precisa."}
            };

            function _contextUi(key){ return EXTRA_ASSIST[key]||ASSIST[key]||ASSIST.home; }
            function _safeBubble(text,who){
              var row=document.createElement("div");
              var bubble=document.createElement("div");
              bubble.className=who==="user"?"chat-bubble-user":"chat-bubble-bot";
              bubble.textContent=String(text||"");
              if(who==="user") row.className="flex justify-end";
              row.appendChild(bubble);
              return row;
            }
            function _contextHistory(){
              return (window._assistMsgs||[]).slice(0,-1).slice(-18).map(function(item){
                return {role:item.r==="u"?"user":"assistant",content:String(item.t||"")};
              });
            }
            async function _aiReplyV4(key,question,curated){
              var log=document.getElementById("assist-ctx-log");
              var input=document.getElementById("assist-ctx-input");
              var sendButton=input&&input.parentElement?input.parentElement.querySelector("button"):null;
              if(input) input.disabled=true;
              if(sendButton) sendButton.disabled=true;
              var typing=_safeBubble("Sto pensando…","bot");
              typing.setAttribute("data-context-typing","true");
              log.appendChild(typing);
              _scrollBottom();
              try{
                var session=window.FrenchiePal.getSessionContext();
                var chat=window._assistSession||window.FrenchiePal.createContextChatSession(key);
                window._assistSession=chat;
                var response=await fetch("/api/chat",{
                  method:"POST",
                  headers:{"Content-Type":"application/json"},
                  body:JSON.stringify({
                    session_id:session.session_id,
                    chat_session_id:chat.chat_session_id,
                    device_type:window.FrenchiePal.getDeviceType(),
                    landing_version:session.landing_version,
                    started_at:session.started_at,
                    chat_started_at:chat.started_at,
                    source_section:"context_assistant",
                    message_source:"context_input",
                    context_key:key,
                    message:question,
                    client_history:_contextHistory()
                  })
                });
                var data=await response.json().catch(function(){return {};});
                typing.remove();
                var reply=response.ok&&data.reply?data.reply:(data.error||curated||"L'assistente non è disponibile. Riprova tra poco.");
                log.appendChild(_safeBubble(reply,"bot"));
                window._assistMsgs.push({r:"a",t:reply});
                if(/@/.test(question)) window.FrenchiePal.markSessionLeadCaptured();
              }catch(error){
                typing.remove();
                var fallback=curated||"L'assistente non è disponibile. Riprova tra poco.";
                log.appendChild(_safeBubble(fallback,"bot"));
                window._assistMsgs.push({r:"a",t:fallback});
              }
              if(input) input.disabled=false;
              if(sendButton) sendButton.disabled=false;
              if(input) input.focus();
              _scrollBottom();
            }
            window.openAssistant=function(key){
              var c=_contextUi(key);
              var active=document.querySelector("#phone-frame .phone-screen.active");
              window._assistOrigin=active?active.id:null;
              window._assistKey=key;
              window._assistSession=window.FrenchiePal.createContextChatSession(key);
              window._assistMsgs=[{r:"a",t:c.greeting}];
              var banner=document.getElementById("assist-ctx-banner");
              banner.innerHTML="";
              var icon=document.createElement("span");
              icon.className="material-symbols-outlined";
              icon.style.cssText="font-size:19px;color:#5e7350;flex:none;font-variation-settings:'FILL' 1;";
              icon.textContent="insights";
              var copy=document.createElement("div");
              var eyebrow=document.createElement("div");
              eyebrow.style.cssText="font-size:8px;font-weight:800;letter-spacing:.06em;color:#5e7350;text-transform:uppercase;";
              eyebrow.textContent="Sta assistendo su";
              var label=document.createElement("div");
              label.style.cssText="font-size:12.5px;font-weight:700;color:#3f4a36;";
              label.textContent=c.ctx;
              copy.appendChild(eyebrow); copy.appendChild(label);
              banner.appendChild(icon); banner.appendChild(copy);
              var log=document.getElementById("assist-ctx-log");
              log.innerHTML="";
              log.appendChild(_safeBubble(c.greeting,"bot"));
              var suggestions=document.createElement("div");
              suggestions.id="assist-ctx-sugg";
              suggestions.style.cssText="display:flex;flex-direction:column;gap:9px;margin-top:2px;";
              (c.q||[]).forEach(function(item,index){
                var button=document.createElement("button");
                button.type="button";
                button.style.cssText="display:flex;align-items:center;gap:10px;border:1px solid #e6dcc8;border-radius:14px;padding:11px 13px;font-size:12px;font-weight:600;color:#574f44;background:#fbf9f4;cursor:pointer;text-align:left;font-family:Nunito,sans-serif;";
                var help=document.createElement("span");
                help.className="material-symbols-outlined";
                help.style.cssText="font-size:18px;color:#5e7350;flex:none;";
                help.textContent="help";
                var text=document.createElement("span");
                text.textContent=item.t;
                button.appendChild(help); button.appendChild(text);
                button.addEventListener("click",function(){window.assistAsk(key,index);});
                suggestions.appendChild(button);
              });
              log.appendChild(suggestions);
              if(window.trackEvent) window.trackEvent("context_assistant_open",{sourceSection:"context_assistant",metadata:{context_key:key,origin_screen:window._assistOrigin}});
              openSubScreen("screen-assist-ctx");
            };
            window.assistAsk=function(key,index){
              var c=_contextUi(key), item=(c.q||[])[index];
              if(!item) return;
              var log=document.getElementById("assist-ctx-log");
              var suggestions=document.getElementById("assist-ctx-sugg");
              if(suggestions) suggestions.remove();
              log.appendChild(_safeBubble(item.t,"user"));
              window._assistMsgs.push({r:"u",t:item.t});
              if(window.trackEvent) window.trackEvent("context_assistant_suggestion_click",{sourceSection:"context_assistant",metadata:{context_key:key,question:item.t}});
              _scrollBottom();
              _aiReplyV4(key,item.t,item.a||c.fallback);
            };
            window.assistSend=function(){
              var input=document.getElementById("assist-ctx-input");
              var value=(input.value||"").trim();
              if(!value) return;
              if(value.length>1600){ alert("Il messaggio può contenere massimo 1600 caratteri."); return; }
              var key=window._assistKey||"home", c=_contextUi(key);
              var suggestions=document.getElementById("assist-ctx-sugg");
              if(suggestions) suggestions.remove();
              document.getElementById("assist-ctx-log").appendChild(_safeBubble(value,"user"));
              input.value="";
              window._assistMsgs.push({r:"u",t:value});
              _scrollBottom();
              _aiReplyV4(key,value,c.fallback);
            };
})();

/* ===== scripts/maps.js ===== */
/* Mappe OpenStreetMap statiche della demo. */
(function(){
/* ===== Luoghi: navigazione + mappa OpenStreetMap (Leaflet) ===== */
      window.fpGo=function(tab){
        var fr=document.getElementById('phone-frame'); if(!fr) return;
        if(tab==='places'){ window.openPlaces(); return; }
        fr.querySelectorAll('.phone-screen').forEach(function(s){ s.classList.remove('active'); });
        if(typeof window.switchTab==='function') window.switchTab(tab);
      };
      window.openPlaces=function(){
        var fr=document.getElementById('phone-frame'); if(!fr) return;
        fr.querySelectorAll('.phone-screen').forEach(function(s){ s.classList.remove('active'); });
        var p=document.getElementById('screen-places'); if(p) p.classList.add('active');
        initPlacesMap();
      };
      var _placesMap=null, _layers={};
      function pinIcon(name,color){ return L.divIcon({className:'',iconSize:[30,42],iconAnchor:[15,40],html:'<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:'+color+';transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 7px rgba(40,30,15,.32);"><span class="material-symbols-outlined" style="transform:rotate(45deg);font-size:17px;color:#fff;font-variation-settings:&apos;FILL&apos; 1;">'+name+'</span></div>'}); }
      function ownerIcon(n){ var c = n>1 ? '<span style="position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;border-radius:9px;background:#2f2b24;color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;border:1.5px solid #fff;font-family:Nunito,sans-serif;">'+n+'</span>' : ''; return L.divIcon({className:'',iconSize:[26,26],iconAnchor:[13,13],html:'<div style="position:relative;width:24px;height:24px;border-radius:50%;background:#5e7350;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(40,30,15,.25);"><span class="material-symbols-outlined" style="font-size:14px;color:#fff;font-variation-settings:&apos;FILL&apos; 1;">pets</span>'+c+'</div>'}); }
      function meIcon(){ return L.divIcon({className:'',iconSize:[18,18],iconAnchor:[9,9],html:'<div style="width:16px;height:16px;border-radius:50%;background:#3f6f8f;border:3px solid #fff;box-shadow:0 0 0 6px rgba(63,111,143,.18),0 1px 4px rgba(0,0,0,.3);"></div>'}); }
      function showMapFallback(el){
        if(!el||el.querySelector('.map-fallback')) return;
        el.style.position='relative';
        var message=document.createElement('div');
        message.className='map-fallback';
        message.textContent='La mappa non è disponibile. Controlla la connessione e ricarica la pagina.';
        el.appendChild(message);
      }
      function initPlacesMap(){
        var el=document.getElementById('places-map'); if(!el) return;
        if(_placesMap){ setTimeout(function(){ _placesMap.invalidateSize(); },90); return; }
        if(!window.L){ showMapFallback(el); return; }
        var center=[45.47235,9.17560];
        _placesMap=L.map(el,{zoomControl:false,attributionControl:false,scrollWheelZoom:false}).setView(center,15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,detectRetina:true}).addTo(_placesMap);
        L.marker(center,{icon:meIcon()}).addTo(_placesMap);
        _layers.owners=L.layerGroup().addTo(_placesMap);
        _layers.parks=L.layerGroup().addTo(_placesMap);
        _layers.hazard=L.layerGroup().addTo(_placesMap);
        [[45.4733,9.1738,1],[45.4707,9.1789,3],[45.4739,9.1772,1]].forEach(function(o){
          L.circle([o[0],o[1]],{radius:65,color:'#5e7350',weight:1.5,dashArray:'4 4',fillColor:'#5e7350',fillOpacity:0.12}).addTo(_layers.owners);
          L.marker([o[0],o[1]],{icon:ownerIcon(o[2])}).addTo(_layers.owners).on('click',function(){ window.openSubScreen('screen-place-owners'); });
        });
        L.marker([45.4727,9.1719],{icon:pinIcon('park','#5e7350')}).addTo(_layers.parks).on('click',function(){ window.openSubScreen('screen-place-park'); });
        L.marker([45.4711,9.1771],{icon:pinIcon('medical_services','#6a5a8f')}).addTo(_layers.parks).on('click',function(){ window.openSubScreen('screen-place-vet'); });
        L.marker([45.4722,9.1746],{icon:pinIcon('warning','#c2552f')}).addTo(_layers.hazard).on('click',function(){ window.openSubScreen('screen-place-hazard'); });
        L.marker([45.4716,9.1783],{icon:pinIcon('priority_high','#cf8a3c')}).addTo(_layers.hazard).on('click',function(){ window.openSubScreen('screen-place-hazard'); });
        setTimeout(function(){ _placesMap.invalidateSize(); },90);
      }
      window.placesFilter=function(cat,btn){
        var bar=btn.parentElement;
        bar.querySelectorAll('.pchip').forEach(function(c){ c.className='pchip pchip-off'; });
        btn.className='pchip pchip-on';
        if(!_placesMap) return;
        function set(layer,on){ if(!layer) return; if(on){ if(!_placesMap.hasLayer(layer)) layer.addTo(_placesMap); } else { if(_placesMap.hasLayer(layer)) _placesMap.removeLayer(layer); } }
        set(_layers.owners, cat==='all'||cat==='owners');
        set(_layers.parks, cat==='all'||cat==='parks');
        set(_layers.hazard, cat==='all'||cat==='hazard');
      };
      /* Mappa live nella sezione Luoghi della landing (stesso OSM + marker dell'app) */
      var _luoghiLandingMap=null;
      function initLuoghiLandingMap(){
        var el=document.getElementById('luoghi-landing-map'); if(!el) return;
        if(!window.L){ showMapFallback(el); return; }
        if(_luoghiLandingMap){ _luoghiLandingMap.invalidateSize(); return; }
        var center=[45.47235,9.17560];
        _luoghiLandingMap=L.map(el,{zoomControl:false,attributionControl:true,scrollWheelZoom:false}).setView(center,15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,detectRetina:true,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · dati demo'}).addTo(_luoghiLandingMap);
        L.marker(center,{icon:meIcon()}).addTo(_luoghiLandingMap);
        [[45.4733,9.1738,1],[45.4707,9.1789,3],[45.4739,9.1772,1]].forEach(function(o){
          L.circle([o[0],o[1]],{radius:65,color:'#5e7350',weight:1.5,dashArray:'4 4',fillColor:'#5e7350',fillOpacity:0.12}).addTo(_luoghiLandingMap);
          L.marker([o[0],o[1]],{icon:ownerIcon(o[2])}).addTo(_luoghiLandingMap);
        });
        L.marker([45.4727,9.1719],{icon:pinIcon('park','#5e7350')}).addTo(_luoghiLandingMap);
        L.marker([45.4711,9.1771],{icon:pinIcon('medical_services','#6a5a8f')}).addTo(_luoghiLandingMap);
        L.marker([45.4722,9.1746],{icon:pinIcon('warning','#c2552f')}).addTo(_luoghiLandingMap);
        L.marker([45.4716,9.1783],{icon:pinIcon('priority_high','#cf8a3c')}).addTo(_luoghiLandingMap);
        setTimeout(function(){ _luoghiLandingMap.invalidateSize(); },140);
      }
if(document.readyState==='complete'){ try{ initLuoghiLandingMap(); }catch(e){} }
else window.addEventListener('load',function(){ try{ initLuoghiLandingMap(); }catch(e){} });
})();
