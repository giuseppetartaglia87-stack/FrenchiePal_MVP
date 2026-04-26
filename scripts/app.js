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