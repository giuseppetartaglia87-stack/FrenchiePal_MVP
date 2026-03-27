window.FrenchiePal = window.FrenchiePal || {};

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

window.FrenchiePal.createChatController = function createChatController({ trackChatOpenOnce, demoController, sessionId }) {
    const chatInputWeb = document.getElementById('web-chat-input');
    const chatInputPhone = document.getElementById('phone-chat-input');
    const chatLog = document.getElementById('phone-chat-log');

    function buildFallbackReply(message) {
        const msg = String(message || '').toLowerCase();

        if (msg.includes('caldo') || msg.includes('respiro') || msg.includes('affanno')) {
            return 'Se vedi caldo o affanno, fai pausa, ombra e riduci il movimento. Se vuoi, puoi anche confrontare questo caso con lo scenario Respiro nella demo alert.';
        }

        if (msg.includes('salti') || msg.includes('scale') || msg.includes('schiena') || msg.includes('ernia')) {
            return 'Per la schiena, nei momenti delicati conviene limitare salti, scale e cambi di quota. Se vuoi, apri anche lo scenario Schiena per vedere come FrenchiePal lo segnalerebbe.';
        }

        if (msg.includes('pelle') || msg.includes('prurito') || msg.includes('gratta') || msg.includes('pieghe')) {
            return 'Se noti più grattamento del solito, controlla pieghe, rossori e umidità nelle zone sensibili. Puoi anche provare lo scenario Pelle per vedere l’alert dedicato.';
        }

        return 'Questa è una risposta demo locale: posso darti consigli base su routine, respiro, schiena e pelle del Frenchie. Prova a scrivermi per esempio “può fare le scale?” oppure “che faccio se ha caldo?”';
    }

    function addChatBubble(text, sender, isTyping = false) {
        const div = document.createElement('div');

        if (sender === 'user') {
            div.className = 'flex items-center justify-end gap-2';
            div.innerHTML = `<div class="chat-bubble-user p-2.5 rounded-[22px] rounded-tr-none text-[11px] leading-[1.35] shadow-lg max-w-[85%]">${escapeHtml(text)}</div>`;
        } else {
            div.className = 'flex items-start gap-2 animate-fade-in';
            if (isTyping) div.setAttribute('data-typing', 'true');
            div.innerHTML = `
                <div class="w-8 h-8 rounded-2xl bg-indigo-500/12 text-indigo-100 flex items-center justify-center text-[11px] shrink-0">
                    <i class="fas fa-dog"></i>
                </div>
                <div class="chat-bubble-bot p-2.5 rounded-[22px] rounded-tl-none text-[11px] leading-[1.35] shadow-sm max-w-[85%]">
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

    async function triggerChat(source) {
        let userMsg = '';

        if (source === 'phone') {
            userMsg = chatInputPhone.value.trim();
            chatInputPhone.value = '';
        } else {
            userMsg = chatInputWeb.value.trim();
            chatInputWeb.value = '';
        }

        if (!userMsg) return;

        trackChatOpenOnce(source === 'phone' ? 'phone_input' : 'web_input');
        demoController.ensureDemoVisibility('chat');

        addChatBubble(userMsg, 'user');
        addChatBubble('Sto pensando...', 'bot', true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: userMsg
                })
            });

            const data = await res.json().catch(() => ({}));
            removeTypingBubble();

            if (!res.ok) {
                addChatBubble(data.error || buildFallbackReply(userMsg), 'bot');
                return;
            }

            addChatBubble(data.reply, 'bot');
        } catch (e) {
            removeTypingBubble();
            addChatBubble(buildFallbackReply(userMsg), 'bot');
        }
    }

    function init() {
        chatInputWeb?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerChat('web');
            }
        });

        chatInputPhone?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerChat('phone');
            }
        });
    }

    return {
        triggerChat,
        init
    };
};
