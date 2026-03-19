import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PRIVACY_WARNING =
  "Grazie! Per motivi di privacy, ti prego di non inserire qui dati personali come numero di telefono o indirizzo. Continuiamo a parlare del tuo Frenchie? 🐶";

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

function extractEmail(text = "") {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

function sanitizeMessage(text = "") {
  let out = text;

  out = out.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]");
  out = out.replace(/(\+?\d[\d\s().-]{7,}\d)/g, "[TELEFONO]");
  out = out.replace(/\b(via|viale|piazza|corso|largo)\s+[a-zà-ù0-9\s.'-]{3,}/gi, "[INDIRIZZO]");

  return out.trim();
}

function containsBlockedPersonalData(text = "") {
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(text);
  const hasAddress = /\b(via|viale|piazza|corso|largo)\s+[a-zà-ù0-9\s.'-]{3,}/i.test(text);
  return hasPhone || hasAddress;
}

function inferTopic(message = "") {
  const msg = message.toLowerCase();

  if (
    msg.includes("schiena") ||
    msg.includes("ernia") ||
    msg.includes("ivdd") ||
    msg.includes("salta") ||
    msg.includes("salti") ||
    msg.includes("divano") ||
    msg.includes("scale")
  ) return "schiena";

  if (
    msg.includes("respiro") ||
    msg.includes("respira") ||
    msg.includes("affanno") ||
    msg.includes("russa") ||
    msg.includes("caldo") ||
    msg.includes("baos") ||
    msg.includes("temperatura")
  ) return "respiro";

  if (
    msg.includes("pelle") ||
    msg.includes("prurito") ||
    msg.includes("gratta") ||
    msg.includes("grattamento") ||
    msg.includes("pieghe") ||
    msg.includes("dermatite") ||
    msg.includes("orecchie")
  ) return "pelle";

  if (
    msg.includes("cibo") ||
    msg.includes("mangia") ||
    msg.includes("routine") ||
    msg.includes("passeggiata") ||
    msg.includes("riposo") ||
    msg.includes("dieta")
  ) return "routine";

  return "other";
}

function inferIntent(message = "") {
  const msg = message.toLowerCase();

  if (
    msg.includes("?") ||
    msg.includes("è normale") ||
    msg.includes("cosa devo fare") ||
    msg.includes("posso") ||
    msg.includes("devo")
  ) return "advice_request";

  if (
    msg.includes("problema") ||
    msg.includes("sintomo") ||
    msg.includes("respira male") ||
    msg.includes("si gratta") ||
    msg.includes("zoppica")
  ) return "symptom_help";

  if (
    msg.includes("preven") ||
    msg.includes("evitare") ||
    msg.includes("monitor") ||
    msg.includes("controllare")
  ) return "prevention_help";

  if (
    msg.includes("interessato") ||
    msg.includes("lista") ||
    msg.includes("mail") ||
    msg.includes("aggiornami")
  ) return "lead_interest";

  return "general_support";
}

function inferNeedsSummary(message = "", topic = "other", intent = "general_support") {
  const msg = message.toLowerCase();

  if (topic === "schiena") {
    if (msg.includes("salti") || msg.includes("divano") || msg.includes("scale")) {
      return "gestione salti/scale e carico sulla schiena";
    }
    return "preoccupazione per schiena/ivdd";
  }

  if (topic === "respiro") {
    if (msg.includes("caldo") || msg.includes("affanno")) {
      return "gestione caldo e difficoltà respiratoria";
    }
    if (msg.includes("russa")) {
      return "rumori respiratori e possibile rischio BAOS";
    }
    return "preoccupazione per respiro/baos";
  }

  if (topic === "pelle") {
    if (msg.includes("pieghe")) {
      return "cura delle pieghe e prevenzione irritazioni";
    }
    if (msg.includes("gratta") || msg.includes("prurito")) {
      return "prurito e possibile dermatite";
    }
    return "preoccupazione per pelle/allergie";
  }

  if (topic === "routine") {
    if (msg.includes("cibo") || msg.includes("dieta") || msg.includes("mangia")) {
      return "supporto su alimentazione e gestione quotidiana";
    }
    return "supporto sulla routine quotidiana";
  }

  if (intent === "lead_interest") return "interesse verso il prodotto/aggiornamenti";
  return "richiesta generica sul Frenchie";
}

async function ensureChatSession(sessionId) {
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("id, session_id, opened_at, last_activity_at")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("chat_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("session_id", sessionId);
    return existing;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert([{
      session_id: sessionId,
      opened_at: now,
      last_activity_at: now,
      lead_captured: false
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createEvent(sessionId, eventName, eventData = {}) {
  await supabase.from("events").insert([{
    session_id: sessionId,
    event_name: eventName,
    event_data: eventData
  }]);
}

async function upsertChatLead(sessionId, email) {
  const { data: existing } = await supabase
    .from("waitlist_leads")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!existing) {
    await supabase.from("waitlist_leads").insert([{
      email,
      dog_age: null,
      priority: null,
      source: "chat",
      session_id: sessionId
    }]);
  }

  await supabase
    .from("chat_sessions")
    .update({ lead_captured: true, last_activity_at: new Date().toISOString() })
    .eq("session_id", sessionId);

  await createEvent(sessionId, "lead_chat_submit", { source: "chat" });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { session_id, message } = req.body || {};

    if (!session_id || !message || typeof message !== "string") {
      return res.status(400).json({ error: "session_id e message sono obbligatori" });
    }

    await ensureChatSession(session_id);

    const rawMessage = message.trim();
    const extractedEmail = extractEmail(rawMessage);

    if (extractedEmail) {
      await upsertChatLead(session_id, extractedEmail);
    }

    if (containsBlockedPersonalData(rawMessage)) {
      const warningText = PRIVACY_WARNING;
      const sanitizedUserMessage = sanitizeMessage(rawMessage);

      const topic = inferTopic(sanitizedUserMessage);
      const intent = inferIntent(sanitizedUserMessage);
      const needsSummary = inferNeedsSummary(sanitizedUserMessage, topic, intent);

      const { count: userCountBefore } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session_id)
        .eq("role", "user");

      if ((userCountBefore || 0) === 0) {
        await createEvent(session_id, "chat_first_message", { source: "chat_api" });
      }

      await supabase.from("chat_messages").insert([
        {
          session_id,
          role: "user",
          content: sanitizedUserMessage,
          topic,
          intent,
          needs_summary: needsSummary
        },
        {
          session_id,
          role: "assistant",
          content: warningText,
          topic,
          intent: "privacy_warning",
          needs_summary: "richiesta con possibile dato personale"
        }
      ]);

      await supabase
        .from("chat_sessions")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("session_id", session_id);

      return res.status(200).json({ reply: warningText });
    }

    const sanitizedUserMessage = sanitizeMessage(rawMessage);
    const topic = inferTopic(sanitizedUserMessage);
    const intent = inferIntent(sanitizedUserMessage);
    const needsSummary = inferNeedsSummary(sanitizedUserMessage, topic, intent);

    const { count: userCountBefore } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session_id)
      .eq("role", "user");

    if ((userCountBefore || 0) === 0) {
      await createEvent(session_id, "chat_first_message", { source: "chat_api" });
    }

    await supabase.from("chat_messages").insert([{
      session_id,
      role: "user",
      content: sanitizedUserMessage,
      topic,
      intent,
      needs_summary: needsSummary
    }]);

    const { data: historyRows } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(12);

    const history = (historyRows || [])
      .filter((row) => row.role === "user" || row.role === "assistant")
      .map((row) => ({ role: row.role, content: row.content }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        ...history
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "C’è stato un problema. Riprova tra poco.";

    const assistantTopic = topic;
    const assistantIntent = "assistant_reply";
    const assistantNeedsSummary = needsSummary;

    await supabase.from("chat_messages").insert([{
      session_id,
      role: "assistant",
      content: reply,
      topic: assistantTopic,
      intent: assistantIntent,
      needs_summary: assistantNeedsSummary
    }]);

    await supabase
      .from("chat_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("session_id", session_id);

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("chat api error", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
}
