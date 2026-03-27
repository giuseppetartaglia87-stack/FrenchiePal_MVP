window.FrenchiePal = window.FrenchiePal || {};

const alertStateConfig = {
    stable: {
        status: 'STABILE',
        statusClass: 'text-sky-700',
        icon: '<i class="fas fa-shield-heart"></i>',
        iconContainerClass: 'w-20 h-20 rounded-[24px] bg-sky-100 text-sky-700 flex items-center justify-center shadow-lg transition-all duration-500',
        rr: '24',
        temp: '22 C',
        load: 'Basso',
        title: 'Routine sotto controllo',
        frameClass: '',
        panel: `
            <span class="alert-tag bg-sky-100 text-sky-700">
                <i class="fas fa-wave-square"></i> alert basso
            </span>
            <p class="mt-2 text-[0.78rem] leading-relaxed text-slate-600">Routine regolare. Tocca uno scenario per vedere come cambia l'alert.</p>
        `
    },
    ivdd: {
        status: 'ATTENZIONE',
        statusClass: 'text-rose-600',
        icon: '<i class="fas fa-bone text-rose-500"></i>',
        iconContainerClass: 'w-20 h-20 rounded-[24px] bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg transition-all duration-500 scale-110',
        rr: '28',
        temp: '23 C',
        load: 'Picchi',
        title: 'Schiena sotto stress',
        frameClass: 'alert-mode-red',
        panel: `
            <span class="alert-tag bg-rose-100 text-rose-700">
                <i class="fas fa-bone"></i> priorita alta
            </span>
            <p class="mt-2 text-[0.78rem] leading-relaxed text-slate-600">Troppi salti o scale: meglio ridurre subito gli impatti.</p>
        `
    },
    baos: {
        status: 'ALLERTA',
        statusClass: 'text-amber-600',
        icon: '<i class="fas fa-lungs text-amber-500"></i>',
        iconContainerClass: 'w-20 h-20 rounded-[24px] bg-amber-100 text-amber-600 flex items-center justify-center shadow-lg transition-all duration-500 scale-110',
        rr: '38',
        temp: '31 C',
        load: 'Alta',
        title: 'Respiro da monitorare',
        frameClass: 'alert-mode-orange',
        panel: `
            <span class="alert-tag bg-amber-100 text-amber-700">
                <i class="fas fa-lungs"></i> priorita media-alta
            </span>
            <p class="mt-2 text-[0.78rem] leading-relaxed text-slate-600">Caldo e sforzo stanno rallentando il recupero: serve una pausa.</p>
        `
    },
    derma: {
        status: 'CONTROLLA',
        statusClass: 'text-fuchsia-600',
        icon: '<i class="fas fa-paw text-fuchsia-500"></i>',
        iconContainerClass: 'w-20 h-20 rounded-[24px] bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shadow-lg transition-all duration-500',
        rr: '24',
        temp: '22 C',
        load: 'Normale',
        title: 'Trend di grattamento in aumento',
        frameClass: 'alert-mode-yellow',
        panel: `
            <span class="alert-tag bg-fuchsia-100 text-fuchsia-700">
                <i class="fas fa-paw"></i> attenzione quotidiana
            </span>
            <p class="mt-2 text-[0.78rem] leading-relaxed text-slate-600">Il grattamento sale sopra il solito: conviene controllare pieghe e rossori.</p>
        `
    }
};

window.FrenchiePal.createDemoController = function createDemoController({ trackEvent, trackChatOpenOnce }) {
    const phoneFrame = document.getElementById('phone-frame');
    const screenHome = document.getElementById('screen-home');
    const screenDash = document.getElementById('screen-dashboard');
    const screenChat = document.getElementById('screen-chat');
    const demoTabButtons = document.querySelectorAll('[data-demo-tab]');
    const alertScenarioButtons = document.querySelectorAll('[data-alert-scenario]');

    const statusText = document.getElementById('phone-status-text');
    const phoneExitLabel = document.getElementById('phone-exit-label');
    const alertIconContainer = document.getElementById('alert-icon-container');
    const alertIcon = document.getElementById('alert-icon');
    const alertTitle = document.getElementById('alert-title');
    const alertDesc = document.getElementById('alert-desc');
    const valHeart = document.getElementById('val-heart');
    const valTemp = document.getElementById('val-temp');
    const valAct = document.getElementById('val-act');

    const frameAlertModes = ['alert-mode-red', 'alert-mode-orange', 'alert-mode-yellow'];
    let currentAlertType = 'stable';
    let isDemoFullscreen = false;
    let lockedScrollY = 0;

    function getAlertEventType(type) {
        if (type === 'ivdd') return 'schiena';
        if (type === 'baos') return 'respiro';
        if (type === 'derma') return 'pelle';
        return null;
    }

    function getDemoSourceSection() {
        return isMobileViewport() ? 'hero_mobile_demo' : 'hero_demo';
    }

    function trackDemoOpenOnce(trigger) {
        if (sessionStorage.getItem('fp_demo_opened_v2') === '1') return;
        sessionStorage.setItem('fp_demo_opened_v2', '1');
        trackEvent('demo_open', {
            sourceSection: getDemoSourceSection(),
            metadata: { trigger }
        });
    }

    function trackAssistantClick(location) {
        trackEvent('click_assistant', {
            sourceSection: getDemoSourceSection(),
            metadata: {
                location: location || 'assistant'
            }
        });
    }

    function isMobileViewport() {
        return window.matchMedia('(max-width: 1023px)').matches;
    }

    function clearPhoneFrameAlertMode() {
        phoneFrame.classList.remove(...frameAlertModes);
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

    function enterDemoFullscreen() {
        if (!isMobileViewport() || isDemoFullscreen) return;

        lockedScrollY = window.scrollY;
        document.body.classList.add('demo-fullscreen-lock');
        document.body.style.top = `-${lockedScrollY}px`;
        phoneFrame.classList.add('phone-frame-mobile-fullscreen');
        isDemoFullscreen = true;
        updateExitLabel();

        trackDemoOpenOnce('mobile_preview_tap');
        trackEvent('demo_open_mobile_fullscreen', {
            sourceSection: 'hero_mobile_demo',
            metadata: {
                trigger: 'mobile_preview_tap'
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

        requestAnimationFrame(() => {
            window.scrollTo(0, lockedScrollY);
        });
    }

    function renderAlertState(type = 'stable') {
        const config = alertStateConfig[type] || alertStateConfig.stable;
        currentAlertType = type;

        clearPhoneFrameAlertMode();
        if (config.frameClass) {
            void phoneFrame.offsetWidth;
            phoneFrame.classList.add(config.frameClass);
        }

        statusText.textContent = config.status;
        statusText.className = `mt-1 text-[1.45rem] font-black leading-none ${config.statusClass}`;
        alertIcon.innerHTML = config.icon;
        alertIconContainer.className = config.iconContainerClass;
        valHeart.textContent = config.rr;
        valTemp.textContent = config.temp;
        valAct.innerHTML = config.load;
        alertTitle.textContent = config.title;
        alertDesc.innerHTML = config.panel;

        alertScenarioButtons.forEach((button) => {
            const isActive = button.dataset.alertScenario === type;
            button.classList.toggle('bg-gradient-to-b', !isActive);
            button.classList.toggle('from-white', !isActive);
            button.classList.toggle('to-sky-50', !isActive);
            button.classList.toggle('border-sky-400', !isActive);
            button.classList.toggle('text-slate-800', !isActive);
            button.classList.toggle('shadow-sm', !isActive);
            button.classList.toggle('bg-white', !isActive);

            button.classList.toggle('bg-sky-500', isActive);
            button.classList.toggle('text-white', isActive);
            button.classList.toggle('border-sky-500', isActive);
            button.classList.toggle('shadow-sm', isActive);

            if (isActive) {
                button.classList.remove('bg-gradient-to-b', 'from-white', 'to-sky-50', 'bg-white', 'text-slate-800', 'border-sky-400');
            } else {
                button.classList.remove('bg-sky-500', 'text-white', 'border-sky-500');
            }
        });
    }

    function setActiveScreen(screen) {
        [screenHome, screenDash, screenChat].forEach((panel) => panel.classList.remove('active'));

        if (screen === 'home') {
            clearPhoneFrameAlertMode();
            screenHome.classList.add('active');
        } else if (screen === 'chat') {
            clearPhoneFrameAlertMode();
            screenChat.classList.add('active');
            document.dispatchEvent(new CustomEvent('frenchiepal:chat-opened'));
        } else {
            screenDash.classList.add('active');
            renderAlertState(currentAlertType);
        }

        demoTabButtons.forEach((button) => {
            button.classList.toggle('active', button.dataset.demoTab === screen);
        });

        updateExitLabel();
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
            return;
        }

        setActiveScreen('home');
        exitDemoFullscreen();
    }

    function openDemoExperience(screen, location) {
        trackDemoOpenOnce(location || screen);
        ensureDemoVisibility(screen);

        if (screen === 'chat') {
            trackChatOpenOnce(location || 'launcher_chat');
            trackAssistantClick(location || 'launcher_chat');
        }
    }

    function returnToDemoHome() {
        setActiveScreen('home');
    }

    function switchTab(tab) {
        if (tab === 'home') {
            returnToDemoHome();
            return;
        }

        ensureDemoVisibility(tab);

        if (tab === 'chat') {
            trackChatOpenOnce('phone_tab');
            trackAssistantClick('phone_tab');
        }
    }

    function triggerAlert(type, source = 'panel') {
        const alertType = getAlertEventType(type);
        if (alertType) {
            trackEvent('click_alert', {
                sourceSection: 'assistant_demo',
                metadata: {
                    alert_type: alertType,
                    click_source:
                        source || (isDemoFullscreen ? 'fullscreen' : 'hero_demo')
                }
            });
        }

        ensureDemoVisibility('dash');
        renderAlertState(type);
    }

    function setAlertScenario(type) {
        const alertType = getAlertEventType(type);
        if (alertType) {
            trackEvent('click_alert', {
                sourceSection: 'assistant_demo',
                metadata: {
                    alert_type: alertType,
                    click_source: isDemoFullscreen ? 'fullscreen' : 'hero_demo'
                }
            });
        }

        ensureDemoVisibility('dash');
        renderAlertState(type);
    }

    function resetAlerts(source = 'panel') {
        trackEvent('alert_reset', { source });
        ensureDemoVisibility('dash');
        renderAlertState('stable');
    }

    function init() {
        window.addEventListener('resize', () => {
            if (!isMobileViewport() && isDemoFullscreen) {
                exitDemoFullscreen();
            }
        });

        renderAlertState('stable');
        setActiveScreen('home');
    }

    return {
        ensureDemoVisibility,
        openDemoExperience,
        returnToDemoHome,
        switchTab,
        toggleMobileChat,
        triggerAlert,
        setAlertScenario,
        resetAlerts,
        init
    };
};
