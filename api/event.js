import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id, event_name, event_data } = req.body || {};

    if (!event_name) {
      return res.status(400).json({ error: 'event_name obbligatorio' });
    }

    const { error } = await supabase.from('events').insert([
      {
        session_id: session_id || null,
        event_name,
        event_data: event_data || {}
      }
    ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Event API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}