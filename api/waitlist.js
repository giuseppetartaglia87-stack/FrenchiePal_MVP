import {
  markSessionLeadCaptured,
  saveLead,
  trackEvent,
  upsertLandingSession
} from './_lib/tracking.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      email,
      dog_age: dogAge,
      priority,
      session_id: sessionId,
      device_type: deviceType,
      landing_version: landingVersion,
      started_at: startedAt
    } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email obbligatoria' });
    }

    await upsertLandingSession({
      sessionId,
      startedAt,
      deviceType,
      landingVersion,
      userAgent: req.headers['user-agent']
    });

    const { error: leadError } = await saveLead({
      sessionId,
      email,
      leadSource: 'form',
      landingVersion,
      featurePriority: priority || null
    });

    if (leadError) {
      return res.status(500).json({ error: leadError.message });
    }

    await markSessionLeadCaptured({
      sessionId,
      startedAt,
      deviceType,
      landingVersion,
      userAgent: req.headers['user-agent']
    });

    await trackEvent({
      sessionId,
      eventName: 'form_submit',
      sourceSection: 'waitlist',
      deviceType,
      landingVersion,
      startedAt,
      leadCaptured: true,
      metadata: {
        lead_source: 'form',
        feature_priority: priority || null,
        dog_age: dogAge || null
      },
      userAgent: req.headers['user-agent']
    });

    await trackEvent({
      sessionId,
      eventName: 'lead_captured',
      sourceSection: 'waitlist',
      deviceType,
      landingVersion,
      startedAt,
      leadCaptured: true,
      metadata: {
        lead_source: 'form'
      },
      userAgent: req.headers['user-agent']
    });

    if (priority) {
      await trackEvent({
        sessionId,
        eventName: 'feature_priority_submitted',
        sourceSection: 'waitlist',
        deviceType,
        landingVersion,
        startedAt,
        metadata: {
          feature_priority: priority,
          lead_source: 'form'
        },
        userAgent: req.headers['user-agent']
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Waitlist API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
