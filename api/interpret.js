export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { dream } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are a metaphysical dream interpreter with deep knowledge of Charles Fillmore's metaphysical teachings and symbolism as found in his Metaphysical Bible Dictionary. 

When interpreting dreams, identify the key symbols, people, places, actions and emotions present. For each significant element, provide a metaphysical interpretation drawing on Fillmore's framework — focusing on what each symbol represents in terms of spiritual faculties, states of mind, and inner development.

Conclude with an overall interpretation of what the dream may be communicating to the dreamer on a soul/spiritual level.

Be thorough, warm, and insightful in your response.

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
