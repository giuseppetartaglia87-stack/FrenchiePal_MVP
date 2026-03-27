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

    function getChatSessionContext() {
        return window.FrenchiePal.getChatSessionContext();
    }

    function buildFallbackReply(message) {
        const msg = String(message || '').toLowerCase();

        if (msg.includes('caldo') || msg.includes('respiro') || msg.includes('affanno')) {
            return 'Se vedi caldo o affanno, fai pausa, ombra e riduci il movimento. Se vuoi, puoi anche confrontare questo caso con lo scenario Respiro nella demo alert.';
        }

        if (msg.includes('salti') || msg.includes('scale') || msg.includes('schiena') || msg.includes('ernia')) {
            return 'Per la schiena, nei momenti delicati conviene limitare salti, scale e cambi di quota. Se vuoi, apri anche lo scenario Schiena per vedere come FrenchiePal lo segnalerebbe.';
        }

        if (msg.includes('pelle') || msg.includes('prurito') || msg.includes('gratta') || msg.includes('pieghe')) {
            return 'Se noti piu grattamento del solito, controlla pieghe, rossori e umidita nelle zone sensibili. Puoi anche provare lo scenario Pelle per vedere l alert dedicato.';
        }

        return 'Questa e una risposta demo locale: posso darti consigli base su routine, respiro, schiena e pelle del Frenchie. Prova a scrivermi per esempio "puo fare le scale?" oppure "che faccio se ha caldo?".';
    }

    function hideSuggestedQuestions() {
        if (suggestedQuestions) {
            suggestedQuestions.remove();
        }
    }

    function addChatBubble(text, sender, isTyping = false) {
        const div = document.createElement('div');

        if (sender === 'user') {
            div.className = 'flex items-center justify-end gap-2';
            div.innerHTML = `<div class="chat-bubble-user p-2.5 rounded-[22px] rounded-tr-none text-[11px] leading-[1.35] shadow-lg max-w-[85%]">${escapeHtml(text)}</div>`;
        } else {
            div.className = 'flex items-start animate-fade-in';
            if (isTyping) div.setAttribute('data-typing', 'true');
            div.innerHTML = `
                <div class="chat-bubble-bot w-full p-2.5 rounded-[22px] text-[11px] leading-[1.35] shadow-sm">
                    ${escapeHtml(text)}
                </div>
            `;
        }

        chatLog.appendChild(div);
        chatLog.scrollTop = chatLog.scrollHeight;
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
            suggested: true
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
