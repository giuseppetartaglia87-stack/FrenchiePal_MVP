import { trackEvent } from './_lib/tracking.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    if (!eventName) {
      return res.status(400).json({ error: 'event_name obbligatorio' });
    }

    const { error } = await trackEvent({
      sessionId,
      eventName,
      sourceSection,
      deviceType,
      landingVersion,
      metadata: metadata || {},
      startedAt,
      endedAt,
      leadCaptured,
      userAgent: req.headers['user-agent']
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Event API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
