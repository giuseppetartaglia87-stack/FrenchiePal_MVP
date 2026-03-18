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
    const { email, dog_age, priority, session_id } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email obbligatoria' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data, error } = await supabase
      .from('waitlist_leads')
      .upsert(
        [
          {
            email: normalizedEmail,
            dog_age: dog_age || null,
            priority: priority || null,
            source: 'form',
            session_id: session_id || null
          }
        ],
        { onConflict: 'email,source' }
      )
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await supabase.from('events').insert([
      {
        session_id: session_id || null,
        event_name: 'lead_form_submit',
        event_data: {
          priority: priority || null,
          source: 'form'
        }
      }
    ]);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Waitlist API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}