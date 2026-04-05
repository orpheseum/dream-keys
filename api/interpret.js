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
        outputDimensionality: 768
      })
    }
  );
  const embedData = await embedRes.json();
  const embedding = embedData.embedding?.values;
  if (!embedding) return res.status(500).json({ interpretation: 'Embedding failed. Please try again.' });

  // Step 2: Search Supabase for relevant Fillmore passages
  const searchUrl = `${supabaseUrl}/rest/v1/rpc/match_fillmore`;
  console.log('Searching:', searchUrl);
  
  const searchRes = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query_embedding: embedding, match_count: 8 })
  });
  
  const rawText = await searchRes.text();
  console.log('Search status:', searchRes.status);
  console.log('Search response:', rawText.substring(0, 500));
  
  const passages = JSON.parse(rawText);
  const context = Array.isArray(passages)
    ? passages.map(p => p.entry_text).join('\n\n---\n\n')
    : '';

  console.log('PASSAGES RETRIEVED:', context.substring(0, 1000));

  // Step 3: Interpret with Gemini using retrieved passages
  const prompt = `You are a metaphysical dream interpreter using Charles Fillmore's Metaphysical Bible Dictionary as your sole reference. Relevant passages from the book are provided below.

FILLMORE PASSAGES:
${context}

INSTRUCTIONS:
1. Open with one concise paragraph identifying the core spiritual tension or theme the dream is exploring, framed in Fillmore's metaphysical language. No flattery.

2. Interpret each significant element (people, places, objects, actions, situations) under its own heading. For each:
   - Quote directly from the passages above using bold or quotation marks — do not paraphrase where a direct quote exists
   - Identify the precise Fillmore concept (e.g. "Judas faculty", "acquisitiveness", "carnal mind") by name
   - If the exact word is absent from the passages, state the closest Fillmore concept and apply it explicitly
   - Every sentence must add new information — no repetition

3. End with "Comprehensive Interpretation" — synthesise all elements into one decisive spiritual meaning. This must go beyond restating individual elements and reveal what the soul is being shown at a deeper level. Use Fillmore's terminology throughout.

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
