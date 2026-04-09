export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { dream, level } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  // Step 1: Embed the dream
  const embedRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: dream }] },
        outputDimensionality: 768
      })
    }
  );
  const embedData = await embedRes.json();
  const embedding = embedData.embedding?.values;
  if (!embedding) return res.status(500).json({ interpretation: 'Embedding failed. Please try again.' });

  // Step 2: Vector search
  const searchRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_fillmore`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query_embedding: embedding, match_count: 15 })
  });
  const passages = await searchRes.json();
  const vectorContext = Array.isArray(passages)
    ? passages.map(p => p.entry_text).join('\n\n---\n\n')
    : '';

  // Step 3: Keyword search
  const keywords = dream.toLowerCase()
    .match(/\b(boat|ship|water|left|right|hand|silence|applause|friend|audience|show|magic|money|financial|stage|people|fire|house|father|mother|son|daughter|king|city|river|mountain|light|dark|door|road|sea|sky|sun|moon|star|tree|child|man|woman|horse|lion|gold|silver|blood|death|life|sleep|dream|sword|spirit|soul|mind|heart|eye|voice|angel|devil|sin|prayer|faith|love|fear|joy|peace|war|judge|priest|temple|ark|cross|bread|wine|book|word|name|number|color|white|black|red|blue|green)\b/g) || [];

  const uniqueKeywords = [...new Set(keywords)].slice(0, 10);

  let keywordContext = '';
  if (uniqueKeywords.length > 0) {
    const keywordRes = await fetch(`${supabaseUrl}/rest/v1/fillmore_entries?or=(${uniqueKeywords.map(k => `entry_text.ilike.*${k}*`).join(',')})&limit=10`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const keywordPassages = await keywordRes.json();
    keywordContext = Array.isArray(keywordPassages)
      ? keywordPassages.map(p => p.entry_text).join('\n\n---\n\n')
      : '';
  }

  const context = vectorContext + (keywordContext ? '\n\n---\n\n' + keywordContext : '');

  // Step 4: Interpret
  const levelInstructions = {
    concise: `Provide a brief interpretation in plain prose (no headings). In 2-3 short paragraphs, identify the main spiritual theme and the key symbol meanings using Fillmore's framework. No bullet points. Be direct and accessible.`,
    normal: `Interpret the main elements (3-5 most significant) under short headings. For each, give Fillmore's specific metaphysical meaning in 1-2 sentences. End with a short "Overall Interpretation" paragraph. Quote Fillmore directly where relevant.`,
    comprehensive: `1. Open with one concise paragraph identifying the core spiritual tension or theme the dream is exploring, framed in Fillmore's metaphysical language. No flattery.

2. Interpret each significant element (people, places, objects, actions, situations) under its own heading. For each:
   - Quote directly from the passages above using bold or quotation marks — do not paraphrase where a direct quote exists
   - Identify the precise Fillmore concept (e.g. "Judas faculty", "acquisitiveness", "carnal mind") by name
   - If the exact word is absent from the passages, state the closest Fillmore concept and apply it explicitly
   - Every sentence must add new information — no repetition

3. End with "Comprehensive Interpretation" — synthesise all elements into one decisive spiritual meaning that goes beyond restating individual elements. Use Fillmore's terminology throughout.`
  };

  const prompt = `You are a metaphysical dream interpreter using Charles Fillmore's Metaphysical Bible Dictionary as your sole reference. Relevant passages from the book are provided below.

FILLMORE PASSAGES:
${context}

INSTRUCTIONS:
${levelInstructions[level] || levelInstructions.normal}

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
