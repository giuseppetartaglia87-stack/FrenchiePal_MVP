import OpenAI from 'openai';
import {
  createChatSession,
  getChatHistory,
  getNextMessageOrder,
  markChatEmailCaptured,
  markSessionLeadCaptured,
  saveChatMessage,
  saveLead,
  trackEvent,
  updateChatSession,
  upsertLandingSession
} from './_lib/tracking.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const PRIVACY_WARNING =
  'Grazie! Per motivi di privacy, ti prego di non inserire i tuoi dati personali qui. Continuiamo a parlare del tuo amico a quattro zampe? 🐶';

// -----------------------------
// REGEX EMAIL
// -----------------------------
const EMAIL_TEST_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const EMAIL_REPLACE_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

// -----------------------------
// REGEX TELEFONO
// -----------------------------
const PHONE_TEST_REGEX = /(?:\+?\d[\d\s().-]{6,}\d)/;
const PHONE_REPLACE_REGEX = /(?:\+?\d[\d\s().-]{6,}\d)/g;

// -----------------------------
// REGEX INDIRIZZO
// Più restrittiva della versione precedente
// -----------------------------
const ADDRESS_TEST_REGEX =
  /\b(?:via|viale|piazza|corso|largo|vicolo|strada)\s+[A-Za-zÀ-ÿ0-9'’.\- ]{3,}\b/i;

const ADDRESS_REPLACE_REGEX =
  /\b(?:via|viale|piazza|corso|largo|vicolo|strada)\s+[A-Za-zÀ-ÿ0-9'’.\- ]{3,}\b/gi;

// -----------------------------
// REGEX NOME
// Evito "io sono ..." perché genera troppi falsi positivi
// tipo "io sono preoccupato"
// -----------------------------
const NAME_TEST_REGEXES = [
  /\bmi chiamo\s+[A-Za-zÀ-ÿ'’-]{2,30}\b/i,
  /\bil mio nome è\s+[A-Za-zÀ-ÿ'’-]{2,30}\b/i
];

const NAME_REPLACE_REGEXES = [
  {
    re: /(\bmi chiamo)\s+[A-Za-zÀ-ÿ'’-]{2,30}\b/gi,
    replacement: '$1 [NOME]'
  },
  {
    re: /(\bil mio nome è)\s+[A-Za-zÀ-ÿ'’-]{2,30}\b/gi,
    replacement: '$1 [NOME]'
  }
];

function extractEmail(text = '') {
  const matches = text.match(EMAIL_REPLACE_REGEX);
  return matches?.[0] || null;
}

function containsEmail(text = '') {
  return EMAIL_TEST_REGEX.test(text);
}

function containsName(text = '') {
  return NAME_TEST_REGEXES.some((re) => re.test(text));
}

function containsPhone(text = '') {
  return PHONE_TEST_REGEX.test(text);
}

function containsAddress(text = '') {
  return ADDRESS_TEST_REGEX.test(text);
}

// L'email NON conta come motivo di blocco,
// perché vuoi consentirne la raccolta.
function containsRestrictedPersonalDataExcludingEmail(text = '') {
  return containsName(text) || containsPhone(text) || containsAddress(text);
}

function sanitizeForStorage(text = '') {
  let sanitized = text;

  sanitized = sanitized.replace(EMAIL_REPLACE_REGEX, '[EMAIL]');
  sanitized = sanitized.replace(PHONE_REPLACE_REGEX, '[TELEFONO]');
  sanitized = sanitized.replace(ADDRESS_REPLACE_REGEX, '[INDIRIZZO]');

  NAME_REPLACE_REGEXES.forEach(({ re, replacement }) => {
    sanitized = sanitized.replace(re, replacement);
  });

  return sanitized.trim();
}

function sanitizeForModel(text = '') {
  let sanitized = text;

  sanitized = sanitized.replace(
    EMAIL_REPLACE_REGEX,
    '[EMAIL RACCOLTA PER AGGIORNAMENTI]'
  );
  sanitized = sanitized.replace(PHONE_REPLACE_REGEX, '[TELEFONO]');
  sanitized = sanitized.replace(ADDRESS_REPLACE_REGEX, '[INDIRIZZO]');

  NAME_REPLACE_REGEXES.forEach(({ re, replacement }) => {
    sanitized = sanitized.replace(re, replacement);
  });

  return sanitized.trim();
}

function inferTopic(message = '') {
  const msg = message.toLowerCase();

  if (
    msg.includes('salti') ||
    msg.includes('salto') ||
    msg.includes('divano') ||
    msg.includes('scale') ||
    msg.includes('schiena') ||
    msg.includes('ernia') ||
    msg.includes('ivdd')
  ) {
    return 'schiena';
  }

  if (
    msg.includes('caldo') ||
    msg.includes('affanno') ||
    msg.includes('respiro') ||
    msg.includes('russa') ||
    msg.includes('baos')
  ) {
    return 'respiro';
  }

  if (
    msg.includes('pelle') ||
    msg.includes('pieghe') ||
    msg.includes('gratta') ||
    msg.includes('prurito') ||
    msg.includes('dermatite')
  ) {
    return 'pelle';
  }

  return 'routine';
}

function inferIntent(message = '') {
  const msg = message.toLowerCase();

  if (
    msg.includes('è normale') ||
    msg.includes('devo') ||
    msg.includes('posso') ||
    msg.includes('cosa devo fare') ||
    msg.includes('cosa faccio') ||
    msg.includes('?')
  ) {
    return 'advice_request';
  }

  if (
    msg.includes('preven') ||
    msg.includes('evitare') ||
    msg.includes('monitor') ||
    msg.includes('controllare')
  ) {
    return 'prevention_help';
  }

  if (
    msg.includes('interessato') ||
    msg.includes('aggiornami') ||
    msg.includes('lista d') ||
    msg.includes('ti lascio la mail')
  ) {
    return 'lead_interest';
  }

  if (
    msg.includes('sintomo') ||
    msg.includes('problema') ||
    msg.includes('respira male') ||
    msg.includes('si gratta')
  ) {
    return 'symptom_help';
  }

  return 'general_support';
}

function inferNeedsSummary(message = '', topic = 'routine') {
  const msg = message.toLowerCase();

  if (topic === 'schiena') {
    if (
      msg.includes('salti') ||
      msg.includes('divano') ||
      msg.includes('scale')
    ) {
      return 'gestione salti/scale e carico sulla schiena';
    }
    return 'preoccupazione per schiena o ivdd';
  }

  if (topic === 'respiro') {
    if (msg.includes('caldo') || msg.includes('affanno')) {
      return 'gestione caldo e affanno';
    }
    if (msg.includes('russa')) {
      return 'rumori respiratori e possibile rischio baos';
    }
    return 'preoccupazione per respiro';
  }

  if (topic === 'pelle') {
    if (msg.includes('pieghe')) {
      return 'cura pieghe e prevenzione irritazioni';
    }
    if (msg.includes('gratta') || msg.includes('prurito')) {
      return 'prurito e possibile dermatite';
    }
    return 'preoccupazione per pelle o allergie';
  }

  if (msg.includes('cibo') || msg.includes('mangia') || msg.includes('dieta')) {
    return 'supporto su alimentazione';
  }

  return 'supporto sulla routine quotidiana';
}

function extractExperienceRating(message = '') {
  const msg = String(message || '').toLowerCase().trim();

  if (!msg) return null;

  const explicitMatch = msg.match(/\b([1-5])(?:\s*\/\s*5)?\b/);
  const isShortRating =
    msg.length <= 12 ||
    msg.includes('/5') ||
    msg.includes('su 5') ||
    msg.includes('stelle') ||
    msg.includes('voto');

  if (!explicitMatch || !isShortRating) {
    return null;
  }

  return Number(explicitMatch[1]);
}

function extractFeaturePriority(message = '') {
  const msg = String(message || '').toLowerCase();
  const looksLikePriority =
    msg.includes('priorit') ||
    msg.includes('prima') ||
    msg.includes('problema principale') ||
    msg.includes('quello che mi interessa di piu') ||
    msg.includes('mi interessa di piu');

  if (!looksLikePriority) {
    return null;
  }

  if (msg.includes('schiena') || msg.includes('ernia') || msg.includes('ivdd')) {
    return 'schiena';
  }

  if (msg.includes('respiro') || msg.includes('caldo') || msg.includes('baos')) {
    return 'respiro';
  }

  if (msg.includes('pelle') || msg.includes('pieghe') || msg.includes('prurit')) {
    return 'pelle';
  }

  if (msg.includes('routine') || msg.includes('assistente')) {
    return 'routine';
  }

  return null;
}

function isFinalFeedbackPrompt(reply = '') {
  const text = String(reply || '').toLowerCase();
  return (
    text.includes('prima di lasciarci') ||
    text.includes('2 risposte veloci') ||
    text.includes('come valuti questa esperienza')
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    session_id: sessionId,
    chat_session_id: chatSessionId,
    message,
    device_type: deviceType,
    landing_version: landingVersion,
    started_at: startedAt,
    chat_started_at: chatStartedAt,
    source_section: sourceSection,
    message_source: messageSource
  } = req.body || {};

  if (!sessionId || !message) {
    return res
      .status(400)
      .json({ error: 'session_id o message mancanti.' });
  }

  const topic = inferTopic(message);
  const intent = inferIntent(message);
  const needs_summary = inferNeedsSummary(message, topic);

  const now = new Date().toISOString();
  const email = extractEmail(message);
  const hasEmail = containsEmail(message);
  const hasRestrictedPersonalData =
    containsRestrictedPersonalDataExcludingEmail(message);
  const experienceRating = extractExperienceRating(message);
  const featurePriority = extractFeaturePriority(message);
  const effectiveChatSessionId = chatSessionId || `${sessionId}-assistant`;

  const systemPrompt = `
# CONTESTO E IDENTITÀ
Sei "FrenchiePal", assistente esperto per proprietari di cani, con una Iper-Specializzazione nei Bulldog Francesi.

Rispetta queste regole di comportamento:

## 0. REGOLA DI SINTESI (SOLO SULL'OUTPUT)
- Le tue spiegazioni tecniche devono essere concise (max 2-3 frasi), ma il tuo **processo logico** deve essere completo.
- Non usare preamboli inutili ("Capisco", "Certamente").
- Se devi dare consigli multipli, usa un **elenco puntato di MASSIMO 3 punti**, ogni punto dell'elenco deve essere **telegrafico**: una sola frase breve, quasi uno slogan.

## 1. GESTIONE RAZZA
- **Bulldog Francese:** Attiva modalità "FrenchieFriend". Filtra ogni consiglio attraverso la loro fisiologia (brachicefalia, schiena delicata, digestione difficile).
- **Altre Razze:** Dì subito che sei specializzato in Frenchie ma darai consigli generali.

## 2. APPROCCIO CLINICO E FORNITURA DI VALORE
- **Obiettivo:** Capire il problema, ma soprattutto **DARE SOLUZIONI**.
- **SOLO AL PRIMO MESSAGGIO di un nuovo problema, e solo se davvero necessario:** Fai 1 (massimo 2) domande di inquadramento (es. da quanto tempo succede, sintomi specifici). Se la domanda dell’utente è già abbastanza chiara, rispondi subito con consigli pratici. NON inserire promozioni in questa fase.
- **DALLA SECONDA INTERAZIONE IN POI:** Smetti di fare l'investigatore. **DEVI fornire consigli pratici, spiegazioni e soluzioni di valore** basate sulle risposte dell'utente. Non trasformare la chat in un interrogatorio.
- *Eccezione:* Puoi rispondere subito fornendo la soluzione a domande nozionistiche semplici (es. "Quanto pesa un adulto?").

## 3. EQUILIBRIO TRA RISPOSTE E DOMANDE (IL FLUSSO A DUE FASI)
- **La regola d'oro è: Prima offri valore, poi chiedi.** Per evitare interrogatori continui, gestisci ogni nuovo problema posto dall'utente in sole DUE FASI:
- **FASE 1 (Primo messaggio sul problema):** Dai i tuoi consigli pratici e chiudi il messaggio con UNA SOLA domanda morbida per contestualizzare (es. "A che ora pensavi di uscire?" o "Quanti anni ha?"). IN QUESTA FASE NON CHIEDERE ANCORA "C'è altro in cui posso aiutarti?".
- **FASE 2 (Secondo messaggio sul problema):** L'utente risponde alla tua domanda. Tu dai il tuo breve commento/consiglio finale. A QUESTO PUNTO TI È ASSOLUTAMENTE VIETATO fare altre domande sull'argomento. Devi obbligatoriamente chiudere il messaggio con questa esatta frase: "C'è altro in cui posso aiutarti oggi?".
- **Eccezione Monosillabi:** Se l’utente risponde in modo estremamente sintetico ("ok", "tutto sotto controllo") già alla Fase 1, salta la domanda contestuale e passa direttamente alla Fase 2.

## 4. SALUTE E PROMOZIONE PRODOTTO (LEAD GENERATION)
- **Disclaimer Veterinario Alleggerito:** NON ripetere "non sono un veterinario" in ogni messaggio. Usalo in modo molto leggero o discorsivo solo la prima volta che affronti un tema medico, poi smetti di ripeterlo.
- **Piccoli problemi:** Dai consigli pratici, specifici e "trucchi del mestiere".
- **Emergenze:** Sii fermo e manda subito dal veterinario solo per veri pericoli (svenimenti, sangue, paralisi).
- **PROMOZIONE MIRATA (OBBLIGATORIO):** SE nella conversazione si parla di **Schiena/Ernie (IVDD)**, **Respiro/Affanno/Calore (BAOS)** o **Pelle/Prurito/Dermatiti**, inserisci questo testo alla fine del tuo messaggio.
  > "A proposito, stiamo sviluppando una soluzione wearable completa che aiuterà proprio nella gestione quotidiana del Bullo per prevenire e monitorare questi specifici problemi. Se sei interessato a saperne di più, lascia qui la tua mail: sarai tra i primi a essere informato e potrai darci la tua opinione!"
  *ATTENZIONE:* Inserisci questo testo promozionale SOLO nel messaggio in cui stai effettivamente dando i consigli o le soluzioni. MAI nel primo messaggio di sole domande diagnostiche.

## 5. REGOLA PRIVACY
- Se l'utente menziona dati personali (nome, indirizzo, telefono), devi ASSOLUTAMENTE rispondere con questa frase esatta: ${PRIVACY_WARNING} e non dare l'aiuto richiesto.
- *Nota Email per Wearable:* Fai eccezione se l'utente lascia la mail per il wearable. In quel caso, NON usare frasi robotiche. Rispondi in modo naturale ed entusiasta (es. "Perfetto, ho salvato la tua email! Ti terremo aggiornato.") e poi rispondi alla sua eventuale domanda.

## 6. REGOLA CHIUSURA (ATTIVAZIONE FUNNEL FINALE)
- Se l'utente risponde in modo negativo o conclusivo alla tua domanda "C'è altro in cui posso aiutarti?" (es. dice "no", "no grazie", "tutto ok", "a posto così") o saluta per andarsene, DEVI IMMEDIATAMENTE chiudere la conversazione inviando ESATTAMENTE questo testo:
  > "Perfetto! Prima di lasciarci, ci aiuteresti con 2 risposte veloci?
  > 1) Quale aspetto vorresti che venisse completato per primo: supporto quotidiano, schiena/ernie, respiro/BAOS o dermatiti?
  > 2) Se vuoi essere tra i primi a provare FrenchiePal quando sarà pronto, lascia qui la tua mail."
- VIETATO rispondere solo con "Prego" o fare finti convenevoli. Se l'utente chiude, tu inneschi istantaneamente questo messaggio finale.

## 7. REGOLA POST-FEEDBACK (PRIORITÀ MASSIMA - SOVRASCRIVE TUTTO)
- **SE il tuo MESSAGGIO PRECEDENTE era esattamente la richiesta delle domande finali (Regola 6), ALLORA:**
  - Qualsiasi cosa l'utente risponda ora (anche se sembra una richiesta come "Vorrei consigli sul food"), tu devi considerarla SOLO come un feedback.
  - **VIETATO:** Iniziare a dare consigli, aprire nuovi argomenti o fare domande di follow-up su quella risposta.
  - **OBBLIGATORIO:** Rispondere SOLO ringraziando per il feedback e confermando di essere disponibile per nuove chat.

## 8. REGOLA SALVAGENTE (FUORI CONTESTO)
- Se l'utente parla di argomenti che non c'entrano NULLA con cani, Bulldog Francesi o la loro gestione (es. meteo, politica, calcio, o scrive caratteri a caso):
  - NON cercare di collegarlo ai cani forzatamente.
  - Rispondi educatamente: "Scusa, sono allenato solo per parlare dei nostri amici Bulldog Francesi! Hai domande su di loro?"
`;

  try {
    await upsertLandingSession({
      sessionId,
      startedAt,
      deviceType,
      landingVersion,
      userAgent: req.headers['user-agent']
    });

    await createChatSession({
      chatSessionId: effectiveChatSessionId,
      sessionId,
      startedAt: chatStartedAt || now,
      deviceType,
      entryPoint: 'assistant',
      inferredTopic: topic !== 'routine' ? topic : null,
      featurePriority,
      experienceRating
    });

    const previousMessages = await getChatHistory(effectiveChatSessionId);
    const nextMessageOrder = await getNextMessageOrder(effectiveChatSessionId);
    const sanitizedUserMessage = sanitizeForStorage(message);
    const historyForModel = previousMessages.map((item) => ({
      role: item.role,
      content: item.message_text
    }));

    await saveChatMessage({
      chatSessionId: effectiveChatSessionId,
      role: 'user',
      messageText: sanitizedUserMessage,
      messageOrder: nextMessageOrder,
      createdAt: now
    });

    await trackEvent({
      sessionId,
      eventName: 'assistant_user_message_sent',
      sourceSection: sourceSection || 'assistant',
      deviceType,
      landingVersion,
      startedAt,
      metadata: {
        chat_session_id: effectiveChatSessionId,
        message_source: messageSource || 'chat_input',
        inferred_topic: topic,
        intent,
        has_email: hasEmail
      },
      userAgent: req.headers['user-agent']
    });

    if (featurePriority) {
      await updateChatSession(effectiveChatSessionId, {
        feature_priority: featurePriority
      });

      await trackEvent({
        sessionId,
        eventName: 'feature_priority_submitted',
        sourceSection: 'assistant',
        deviceType,
        landingVersion,
        startedAt,
        metadata: {
          chat_session_id: effectiveChatSessionId,
          feature_priority: featurePriority
        },
        userAgent: req.headers['user-agent']
      });
    }

    if (experienceRating) {
      await updateChatSession(effectiveChatSessionId, {
        experience_rating: experienceRating
      });

      await trackEvent({
        sessionId,
        eventName: 'experience_rating_submitted',
        sourceSection: 'assistant',
        deviceType,
        landingVersion,
        startedAt,
        metadata: {
          chat_session_id: effectiveChatSessionId,
          experience_rating: experienceRating
        },
        userAgent: req.headers['user-agent']
      });
    }

    if (email) {
      await saveLead({
        sessionId,
        email,
        leadSource: 'chat',
        landingVersion,
        featurePriority: featurePriority || null,
        experienceRating: experienceRating || null,
        assistantTopic: topic
      });

      await markChatEmailCaptured(effectiveChatSessionId, {
        ...(featurePriority ? { feature_priority: featurePriority } : {}),
        ...(experienceRating ? { experience_rating: experienceRating } : {}),
        inferred_topic: topic
      });

      await markSessionLeadCaptured({
        sessionId,
        startedAt,
        deviceType,
        landingVersion,
        userAgent: req.headers['user-agent']
      });

      await trackEvent({
        sessionId,
        eventName: 'chat_email_submitted',
        sourceSection: 'assistant',
        deviceType,
        landingVersion,
        startedAt,
        leadCaptured: true,
        metadata: {
          chat_session_id: effectiveChatSessionId,
          inferred_topic: topic
        },
        userAgent: req.headers['user-agent']
      });

      await trackEvent({
        sessionId,
        eventName: 'lead_captured',
        sourceSection: 'assistant',
        deviceType,
        landingVersion,
        startedAt,
        leadCaptured: true,
        metadata: {
          lead_source: 'chat',
          chat_session_id: effectiveChatSessionId
        },
        userAgent: req.headers['user-agent']
      });
    }

    if (hasRestrictedPersonalData) {
      await saveChatMessage({
        chatSessionId: effectiveChatSessionId,
        role: 'assistant',
        messageText: PRIVACY_WARNING,
        messageOrder: nextMessageOrder + 1,
        createdAt: now
      });

      await updateChatSession(effectiveChatSessionId, {
        inferred_topic: topic
      });

      return res.status(200).json({
        reply: PRIVACY_WARNING,
        chat_session_id: effectiveChatSessionId
      });
    }

    const currentMessageForModel = sanitizeForModel(message);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyForModel,
        { role: 'user', content: currentMessageForModel }
      ],
      temperature: 0.8
    });

    const reply = completion?.choices?.[0]?.message?.content || 'Errore interno';

    await saveChatMessage({
      chatSessionId: effectiveChatSessionId,
      role: 'assistant',
      messageText: sanitizeForStorage(reply),
      messageOrder: nextMessageOrder + 1,
      createdAt: now
    });

    await updateChatSession(effectiveChatSessionId, {
      ...(topic !== 'routine' ? { inferred_topic: topic } : {}),
      ...(featurePriority ? { feature_priority: featurePriority } : {}),
      ...(experienceRating ? { experience_rating: experienceRating } : {})
    });

    if (isFinalFeedbackPrompt(reply)) {
      await trackEvent({
        sessionId,
        eventName: 'final_feedback_prompt_shown',
        sourceSection: 'assistant',
        deviceType,
        landingVersion,
        startedAt,
        metadata: {
          chat_session_id: effectiveChatSessionId,
          inferred_topic: topic
        },
        userAgent: req.headers['user-agent']
      });
    }

    return res.status(200).json({
      reply,
      chat_session_id: effectiveChatSessionId
    });
  } catch (err) {
    console.error('Chat API Error:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
