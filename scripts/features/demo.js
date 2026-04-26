window.FrenchiePal = window.FrenchiePal || {};

window.FrenchiePal.createDemoController = function createDemoController({
    trackEvent,
    trackChatOpenOnce
}) {
    const phoneFrame = document.getElementById('phone-frame');
    const screenHome = document.getElementById('screen-home');
    const screenDiary = document.getElementById('screen-diary');
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
        diary: {
            screen: screenDiary,
            analyticsTab: 'diary'
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

    function trackDemoTabView(tab, source = 'click') {
        const config = TAB_CONFIG[tab];
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
        const nextScreen = screen === 'alerts' ? 'dash' : screen;

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
        ensureDemoVisibility(screen);

        if (!initialHomeTracked) {
            initialHomeTracked = true;
            trackDemoTabView('home', location || 'demo_open');
        }

        if (screen === 'chat') {
            trackChatOpenOnce(location || 'launcher_chat');
        }

        if (screen && TAB_CONFIG[screen]) {
            trackDemoTabView(screen, location || 'open_demo_experience');
        }
    }

    function returnToDemoHome() {
        setActiveScreen('home');
        trackDemoTabView('home', 'return_home');
    }

    function switchTab(tab) {
        ensureDemoVisibility(tab);
        trackDemoTabView(tab, 'tab_click');

        if (tab === 'chat') {
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