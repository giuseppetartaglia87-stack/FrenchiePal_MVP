import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id, message } = req.body || {};

  if (!session_id || !message) {
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

## 6. REGOLA CHIUSURA GRADUALE
- Se l'utente ringrazia/saluta con l'intenzione di chiudere: "Prego! C'è altro in cui posso aiutarti oggi?"
- SOLO SE dice "NO" (o conferma fine), usa questo elenco:
  > "Perfetto! Prima di lasciarci, aiutaci a migliorare rispondendo a 2 domande.
  > 1) Quale aspetto vorresti che venisse completato per primo: supporto quotidiano, schiena/ernie, respiro/BAOS o dermatiti?
  > 2) Se vuoi essere tra i primi a provare FrenchiePal quando sarà pronto, lascia qui la tua mail."

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
    await supabase
      .from('chat_sessions')
      .upsert([{ session_id, last_activity_at: now }], {
        onConflict: 'session_id'
      });

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();

      await supabase
        .from('waitlist_leads')
        .upsert(
          [
            {
              email: normalizedEmail,
              source: 'chat',
              session_id,
              priority: topic
            }
          ],
          { onConflict: 'email,source' }
        );

      await supabase.from('events').insert([
        {
          session_id,
          event_name: 'lead_chat_submit',
          event_data: { topic, intent, source: 'chat' }
        }
      ]);

      await supabase
        .from('chat_sessions')
        .update({ lead_captured: true, last_activity_at: now })
        .eq('session_id', session_id);
    }

    const { data: previousMessages, error: historyError } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });

    if (historyError) {
      return res.status(500).json({ error: historyError.message });
    }

    const isFirstUserMessage =
      !previousMessages ||
      previousMessages.filter((m) => m.role === 'user').length === 0;

    if (isFirstUserMessage) {
      await supabase.from('events').insert([
        {
          session_id,
          event_name: 'chat_first_message',
          event_data: { topic, intent }
        }
      ]);
    }

    const sanitizedUserMessage = sanitizeForStorage(message);

    await supabase.from('chat_messages').insert([
      {
        session_id,
        role: 'user',
        content: sanitizedUserMessage,
        topic,
        intent,
        needs_summary
      }
    ]);

    await supabase.from('events').insert([
      {
        session_id,
        event_name: 'chat_message_sent',
        event_data: { topic, intent, has_email: hasEmail }
      }
    ]);

    if (hasRestrictedPersonalData) {
      await supabase.from('chat_messages').insert([
        {
          session_id,
          role: 'assistant',
          content: PRIVACY_WARNING,
          topic: 'privacy',
          intent: 'privacy_warning',
          needs_summary: 'richiesta con dati personali bloccata'
        }
      ]);

      await supabase
        .from('chat_sessions')
        .update({ last_activity_at: now })
        .eq('session_id', session_id);

      return res.status(200).json({ reply: PRIVACY_WARNING });
    }

    const historyForModel = (previousMessages || []).map((m) => ({
      role: m.role,
      content: m.content
    }));

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

    await supabase.from('chat_messages').insert([
      {
        session_id,
        role: 'assistant',
        content: sanitizeForStorage(reply),
        topic,
        intent: 'assistant_reply',
        needs_summary
      }
    ]);

    await supabase
      .from('chat_sessions')
      .update({ last_activity_at: now })
      .eq('session_id', session_id);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat API Error:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
