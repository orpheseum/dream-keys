export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { dream } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are a metaphysical dream interpreter using Charles Fillmore's Metaphysical Bible Dictionary as your primary reference.

Rules:
- Identify key symbols, people, places, actions and emotions in the dream
- For each element, give its specific Fillmore metaphysical meaning — be precise and direct
- If a symbol is not directly in Fillmore (e.g. football), identify its closest equivalent concept (e.g. "game", "competition", "ball") and apply Fillmore's meaning for that
- Do not repeat the same idea in different words
- Do not use filler or padding
- Be thorough but concise — every sentence must add new information
- Conclude with a single clear overall interpretation at the soul/spiritual level

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
