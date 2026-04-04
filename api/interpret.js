export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { dream } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  // Step 1: Embed the dream
  const embedRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: dream }] }
      })
    }
  );
  const embedData = await embedRes.json();
  const embedding = embedData.embedding?.values;
  if (!embedding) return res.status(500).json({ interpretation: 'Embedding failed. Please try again.' });

  // Step 2: Search Supabase for relevant Fillmore passages
  const searchRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_fillmore`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query_embedding: embedding, match_count: 8 })
  });
  const passages = await searchRes.json();
  const context = Array.isArray(passages)
    ? passages.map(p => p.entry_text).join('\n\n---\n\n')
    : '';

  // Step 3: Interpret with Gemini using retrieved passages
  const prompt = `You are a metaphysical dream interpreter. Your sole reference is Charles Fillmore's Metaphysical Bible Dictionary. Below are the most relevant passages from the book for this dream.

FILLMORE PASSAGES:
${context}

Using ONLY the above passages as your reference, interpret the dream as follows:

1. Begin with a single introductory paragraph that identifies the overall spiritual theme or tension the dream is exploring, referencing Fillmore's framework. No flattery or filler.

2. Then interpret each significant element (people, places, objects, actions, situations) as a heading. For each:
- Give Fillmore's specific metaphysical meaning drawing directly from the passages above
- Use Fillmore's exact terminology and quote directly where relevant
- If an element maps to a concept in the passages (e.g. football → game), state which concept you are using
- Be precise — no repetition, no padding

3. End with a "Comprehensive Interpretation" section synthesising all elements into a single clear spiritual meaning that adds new insight beyond what was said under each heading.

THE DREAM: ${dream}`;
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const geminiData = await geminiRes.json();
  const interpretation = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to interpret this dream. Please try again.';

  res.status(200).json({ interpretation });
}
