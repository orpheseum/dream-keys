export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { symbol } = req.body;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  const r = await fetch(`${supabaseUrl}/rest/v1/fillmore_entries?entry_text=ilike.${encodeURIComponent(symbol)}*&limit=1`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await r.json();
  const entry = Array.isArray(data) && data.length > 0 ? data[0].entry_text : null;
  res.status(200).json({ entry });
}
