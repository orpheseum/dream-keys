document.getElementById('interpretBtn').addEventListener('click', async () => {
  const dream = document.getElementById('dreamInput').value.trim();
  if (!dream) { alert('Please describe your dream first.'); return; }

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('result').classList.add('hidden');

  try {
    const res = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream })
    });
    const data = await res.json();
    document.getElementById('result').textContent = data.interpretation;
    document.getElementById('result').classList.remove('hidden');
  } catch (e) {
    document.getElementById('result').textContent = 'Something went wrong. Please try again.';
    document.getElementById('result').classList.remove('hidden');
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
});
