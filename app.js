let selectedLevel = 'normal';

// Level buttons
document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLevel = btn.dataset.level;
  });
});

// Word count
document.getElementById('dreamInput').addEventListener('input', () => {
  const text = document.getElementById('dreamInput').value.trim();
  const count = text === '' ? 0 : text.split(/\s+/).length;
  document.getElementById('wordCount').textContent = `${count} word${count !== 1 ? 's' : ''}`;
});

// Interpret
document.getElementById('interpretBtn').addEventListener('click', async () => {
  const dream = document.getElementById('dreamInput').value.trim();
  if (!dream) { alert('Please describe your dream first.'); return; }

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('downloadBtn').classList.add('hidden');
  document.getElementById('copyBtn').classList.add('hidden');
  document.getElementById('saveBtn').classList.add('hidden');

  try {
    const res = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dream, level: selectedLevel })
    });
    const data = await res.json();
    document.getElementById('result').textContent = data.interpretation;
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('downloadBtn').classList.remove('hidden');
    document.getElementById('copyBtn').classList.remove('hidden');
    document.getElementById('saveBtn').classList.remove('hidden');
  } catch (e) {
    document.getElementById('result').textContent = 'Something went wrong. Please try again.';
    document.getElementById('result').classList.remove('hidden');
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
});

// Download
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

// Copy
document.getElementById('copyBtn').addEventListener('click', () => {
  const dream = document.getElementById('dreamInput').value.trim();
  const interpretation = document.getElementById('result').textContent;
  const content = `DREAM\n-----\n${dream}\n\nINTERPRETATION\n--------------\n${interpretation}`;
  navigator.clipboard.writeText(content).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy to Clipboard', 2000);
  });
});

// Save to journal
document.getElementById('saveBtn').addEventListener('click', () => {
  const dream = document.getElementById('dreamInput').value.trim();
  const interpretation = document.getElementById('result').textContent;
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const entry = { date, dream, interpretation, id: Date.now() };
  const journal = JSON.parse(localStorage.getItem('dreamJournal') || '[]');
  journal.unshift(entry);
  localStorage.setItem('dreamJournal', JSON.stringify(journal));
  const btn = document.getElementById('saveBtn');
  btn.textContent = 'Saved!';
  setTimeout(() => btn.textContent = 'Save to Journal', 2000);
  renderJournal();
});

// Journal toggle
document.getElementById('journalToggle').addEventListener('click', () => {
  const list = document.getElementById('journalList');
  const toggle = document.getElementById('journalToggle');
  list.style.display = list.style.display === 'none' ? 'block' : 'none';
  toggle.textContent = list.style.display === 'none' ? 'My Dream Journal ▸' : 'My Dream Journal ▾';
});

// Render journal
function renderJournal() {
  const journal = JSON.parse(localStorage.getItem('dreamJournal') || '[]');
  const list = document.getElementById('journalList');
  if (journal.length === 0) {
    list.innerHTML = '<p style="color:#9b7fa8;font-family:Raleway,sans-serif;font-size:0.85rem;">No entries yet.</p>';
    return;
  }
  list.innerHTML = journal.map(entry => `
    <div class="journal-entry">
      <span class="journal-delete" data-id="${entry.id}">✕ Delete</span>
      <div class="journal-entry-date">${entry.date}</div>
      <div class="journal-entry-dream">${entry.dream.substring(0, 120)}${entry.dream.length > 120 ? '...' : ''}</div>
      <div class="journal-entry-interp" id="interp-${entry.id}">${entry.interpretation}</div>
      <span class="journal-expand" data-id="${entry.id}">Show full interpretation ▾</span>
    </div>
  `).join('');

  document.querySelectorAll('.journal-expand').forEach(btn => {
    btn.addEventListener('click', () => {
      const interp = document.getElementById(`interp-${btn.dataset.id}`);
      interp.classList.toggle('expanded');
      btn.textContent = interp.classList.contains('expanded') ? 'Hide ▴' : 'Show full interpretation ▾';
    });
  });

  document.querySelectorAll('.journal-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const journal = JSON.parse(localStorage.getItem('dreamJournal') || '[]');
      const updated = journal.filter(e => e.id !== parseInt(btn.dataset.id));
      localStorage.setItem('dreamJournal', JSON.stringify(updated));
      renderJournal();
    });
  });
}

renderJournal();
