export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { dream } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are a metaphysical dream interpreter. Your sole reference framework is Charles Fillmore's Metaphysical Bible Dictionary and his metaphysical teachings.

For each significant element in the dream (people, places, objects, actions, situations):
- Use it as a heading
- Identify the precise Fillmore metaphysical concept it represents (e.g. "represents the Judas faculty — acquisitiveness", "symbolises the will — the executive power in man")
- If the exact word is not in Fillmore, find the closest equivalent and state which concept you are applying
- Use Fillmore's own terminology where possible, in bold or quotes
- Use concise bullet points, not paragraphs
- Do not use flattery, filler, poetic language, or questions directed at the dreamer

End with a heading "Comprehensive Interpretation" that synthesises all elements into a single clear spiritual meaning. This section should reveal what the dream is communicating at the soul level — it must add new insight beyond what was already stated under each element.

The user's dream: ${dream}`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );

  const data = await response.json();
  const interpretation = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to interpret this dream. Please try again.';

  res.status(200).json({ interpretation });
}
