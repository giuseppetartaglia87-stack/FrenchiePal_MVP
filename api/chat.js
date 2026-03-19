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

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+?\d[\d\s().-]{6,}\d)/g;
const ADDRESS_REGEX = /\b(via|viale|piazza|corso|largo|vicolo|strada)\b/i;
const ADDRESS_LINE_REGEX = /\b(via|viale|piazza|corso|largo|vicolo|strada)\b.*/gi;
const NAME_REGEX = /\b(mi chiamo|il mio nome è)\b/i;
const NAME_LINE_REGEX_1 = /\b(mi chiamo)\s+[A-Za-zÀ-ÿ' -]+/gi;
const NAME_LINE_REGEX_2 = /\b(il mio nome è)\s+[A-Za-zÀ-ÿ' -]+/gi;

function extractEmail(text = '') {
  const matches = text.match(EMAIL_REGEX);
  return matches?.[0] || null;
}

function containsRestrictedPersonalData(text = '') {
  return PHONE_REGEX.test(text) || ADDRESS_REGEX.test(text) || NAME_REGEX.test(text);
}

function sanitizeForStorage(text = '') {
  let sanitized = text;

  sanitized = sanitized.replace(EMAIL_REGEX, '[EMAIL]');
  sanitized = sanitized.replace(PHONE_REGEX, '[TELEFONO]');
  sanitized = sanitized.replace(NAME_LINE_REGEX_1, '$1 [NOME]');
  sanitized = sanitized.replace(NAME_LINE_REGEX_2, '$1 [NOME]');

  if (ADDRESS_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(ADDRESS_LINE_REGEX, '[INDIRIZZO]');
  }

  return sanitized.trim();
}

function sanitizeForModel(text = '') {
  let sanitized = text;

  sanitized = sanitized.replace(EMAIL_REGEX, '[EMAIL RACCOLTA PER AGGIORNAMENTI]');
  sanitized = sanitized.replace(PHONE_REGEX, '[TELEFONO]');
  sanitized = sanitized.replace(NAME_LINE_REGEX_1, '$1 [NOME]');
  sanitized = sanitized.replace(NAME_LINE_REGEX_2, '$1 [NOME]');

  if (ADDRESS_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(ADDRESS_LINE_REGEX, '[INDIRIZZO]');
  }

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
    if (msg.includes('salti') || msg.includes('divano') || msg.includes('scale')) {
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
    return res.status(400).json({ error: 'session_id o message mancanti.' });
  }

  const topic = inferTopic(message);
  const intent = inferIntent(message);
  const needs_summary = inferNeedsSummary(message, topic);

  const now = new Date().toISOString();
  const email = extractEmail(message);
  const hasRestrictedPersonalData = containsRestrictedPersonalData(message);

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
- **SOLO AL PRIMO MESSAGGIO di un nuovo problema:** Fai 1 (massimo 2) domande di inquadramento (es. da quanto tempo succede, sintomi specifici). NON dare subito la soluzione finale e NON inserire promozioni in questa fase.
- **DALLA SECONDA INTERAZIONE IN POI:** Smetti di fare l'investigatore. **DEVI fornire consigli pratici, spiegazioni e soluzioni di valore** basate sulle risposte dell'utente. Non trasformare la chat in un interrogatorio.
- *Eccezione:* Puoi rispondere subito fornendo la soluzione a domande nozionistiche semplici (es. "Quanto pesa un adulto?").

## 3. EQUILIBRIO TRA RISPOSTE E DOMANDE (RETENTION)
- **La regola d'oro è: Prima offri valore, poi chiedi.** Ogni tuo messaggio deve contenere informazioni utili o consigli prima di passare a qualsiasi domanda.
- Dopo aver dato la tua risposta, **NON chiudere mai con un punto fermo**. Devi SEMPRE stuzzicare l'utente con una (e una sola) domanda specifica per far continuare la conversazione.
- **CASO LIMITE:** Anche se l'utente dice di aver risolto o di aver già prenotato il veterinario, NON chiudere la chat. Trova sempre una domanda correlata alla gestione dell'attesa o al post-problema (es. "Vuoi che ti spieghi come gestirlo nell'attesa della visita?").

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
  > "Perfetto! Prima di lasciarci, ci aiuteresti a migliorare con 2 risposte veloci?
  > 1) Come valuti questa esperienza?
  > 2) Stiamo implementando una soluzione wearable per il tuo bullo che aiuterà a monitorarlo nel tempo, se sei interessato a saperne di più lascia la mail, sarai tra i primi ad essere informato."

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
      .upsert([{ session_id, last_activity_at: now }], { onConflict: 'session_id' });

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
          event_data: {
            topic,
            intent,
            source: 'chat'
          }
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
      !previousMessages || previousMessages.filter((m) => m.role === 'user').length === 0;

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
        event_data: { topic, intent }
      }
    ]);

    if (hasRestrictedPersonalData && !email) {
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
      model: 'gpt-5.4-mini',
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
