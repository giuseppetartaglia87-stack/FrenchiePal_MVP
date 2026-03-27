window.FrenchiePal = window.FrenchiePal || {};

(function bootstrapFrenchiePal() {
    const sessionId = window.FrenchiePal.getSessionId();
    const analytics = window.FrenchiePal.createAnalytics(sessionId);
    const trackEvent = analytics.trackEvent;
    const trackChatOpenOnce = analytics.trackChatOpenOnce;

    trackEvent('page_view');
    window.FrenchiePal.initSectionNav();

    const demoController = window.FrenchiePal.createDemoController({
        trackEvent,
        trackChatOpenOnce
    });

    const chatController = window.FrenchiePal.createChatController({
        trackChatOpenOnce,
        demoController,
        sessionId
    });

    const waitlistController = window.FrenchiePal.createWaitlistController({
        trackEvent,
        sessionId
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
