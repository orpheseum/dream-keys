export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { dream } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are a metaphysical dream interpreter with deep knowledge of Charles Fillmore's metaphysical teachings. Interpret this dream: ${dream}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );

  const data = await response.json();
  res.status(200).json(data);
}
