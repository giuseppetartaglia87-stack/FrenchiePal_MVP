import { trackEvent } from './_lib/tracking.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const {
    session_id: sessionId,
    event_name: eventName,
    source_section: sourceSection,
    device_type: deviceType,
    landing_version: landingVersion,
    metadata,
    started_at: startedAt,
    ended_at: endedAt,
    lead_captured: leadCaptured
  } = req.body || {};

  if (!sessionId || !eventName) {
    return res.status(400).json({ error: 'Evento non valido' });
  }

  try {
    const { error } = await trackEvent({
      sessionId,
      eventName: String(eventName).slice(0, 100),
      sourceSection: sourceSection ? String(sourceSection).slice(0, 100) : null,
      deviceType,
      landingVersion,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      startedAt,
      endedAt,
      leadCaptured,
      userAgent: req.headers['user-agent']
    });
    if (error) return res.status(500).json({ error: 'Tracking non disponibile' });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Event API error:', error);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
