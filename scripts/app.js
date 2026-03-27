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
        sessionContext
    });

    demoController.init();
    chatController.init();

    window.openDemoExperience = demoController.openDemoExperience;
    window.toggleMobileChat = demoController.toggleMobileChat;
    window.returnToDemoHome = demoController.returnToDemoHome;
    window.switchTab = demoController.switchTab;
    window.triggerAlert = demoController.triggerAlert;
    window.setAlertScenario = demoController.setAlertScenario;
    window.resetAlerts = demoController.resetAlerts;
    window.triggerChat = chatController.triggerChat;
    window.sendSuggestedQuestion = chatController.sendSuggestedQuestion;
    window.submitLeadForm = waitlistController.submitLeadForm;
    window.trackEvent = trackEvent;
})();
