import {
  markSessionLeadCaptured,
  saveLead,
  upsertLandingSession
} from './_lib/tracking.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return res.status(503).json({
      error: 'Waitlist non configurata: verifica le variabili Supabase su Vercel.'
    });
  }

  const {
    email,
    dog_age: dogAge,
    priority,
    session_id: sessionId,
    device_type: deviceType,
    landing_version: landingVersion,
    started_at: startedAt
  } = req.body || {};

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 254) {
    return res.status(400).json({ error: 'Inserisci un indirizzo email valido' });
  }

  try {
    await upsertLandingSession({
      sessionId,
      startedAt,
      deviceType,
      landingVersion,
      userAgent: req.headers['user-agent']
    });

    const { error } = await saveLead({
      sessionId,
      email: cleanEmail,
      leadSource: 'form',
      landingVersion,
      featurePriority: priority ? String(priority).slice(0, 80) : null
    });

    if (error) {
      return res.status(500).json({ error: 'Impossibile salvare la richiesta' });
    }

    await markSessionLeadCaptured({
      sessionId,
      startedAt,
      deviceType,
      landingVersion,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Waitlist API error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
