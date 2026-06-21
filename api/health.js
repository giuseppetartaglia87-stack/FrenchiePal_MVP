export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const supabaseConfigured =
    Boolean(process.env.SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return res.status(openaiConfigured && supabaseConfigured ? 200 : 503).json({
    ok: openaiConfigured && supabaseConfigured,
    version: 'v4',
    openai_configured: openaiConfigured,
    supabase_configured: supabaseConfigured,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  });
}
