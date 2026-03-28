document.getElementById('interpretBtn').addEventListener('click', async () => {
  const dream = document.getElementById('dreamInput').value.trim();
  if (!dream) { alert('Please describe your dream first.'); return; }

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('downloadBtn').classList.add('hidden');

  try {
    const res = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream })
    });
    const data = await res.json();
    document.getElementById('result').textContent = data.interpretation;
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('downloadBtn').classList.remove('hidden');
  } catch (e) {
    document.getElementById('result').textContent = 'Something went wrong. Please try again.';
    document.getElementById('result').classList.remove('hidden');
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  const dream = document.getElementById('dreamInput').value.trim();
  const interpretation = document.getElementById('result').textContent;
  const content = `DREAM\n-----\n${dream}\n\nINTERPRETATION\n--------------\n${interpretation}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dream-interpretation.txt';
  a.click();
  URL.revokeObjectURL(url);
});
