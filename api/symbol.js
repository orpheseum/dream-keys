export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { symbol } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  // Embed the symbol
  const embedRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: `metaphysical meaning of ${symbol} according to Charles Fillmore` }] },
        outputDimensionality: 768
      })
    }
  );
  const embedData = await embedRes.json();
  const embedding = embedData.embedding?.values;
  if (!embedding) return res.status(500).json({ entry: null });

  // Vector search
  const searchRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_fillmore`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query_embedding: embedding, match_count: 1 })
  });
  const passages = await searchRes.json();
  const entry = Array.isArray(passages) && passages.length > 0 ? passages[0].entry_text : null;
  res.status(200).json({ entry });
}
