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
  document.getElementById('saveBtn').classList.add('hidden');
  document.getElementById('shareBtn').classList.add('hidden');
  document.getElementById('symbolsSection').classList.add('hidden');

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
    document.getElementById('shareBtn').classList.remove('hidden');
    document.getElementById('saveBtn').classList.remove('hidden');

    // Symbols
    const symbolsSection = document.getElementById('symbolsSection');
    const symbolsList = document.getElementById('symbolsList');
    const symbolDetail = document.getElementById('symbolDetail');
    symbolDetail.classList.add('hidden');
    
    if (data.symbols && data.symbols.length > 0) {
      symbolsList.innerHTML = data.symbols.map(s =>
        `<span class="symbol-tag" data-symbol="${s}">${s}</span>`
      ).join('');
      symbolsSection.classList.remove('hidden');

      document.querySelectorAll('.symbol-tag').forEach(tag => {
        tag.addEventListener('click', async () => {
          document.querySelectorAll('.symbol-tag').forEach(t => t.classList.remove('active'));
          tag.classList.add('active');
          symbolDetail.textContent = 'Loading...';
          symbolDetail.classList.remove('hidden');

          const res = await fetch('/api/symbol', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: tag.dataset.symbol })
          });
          const data = await res.json();
          symbolDetail.textContent = data.entry || 'No entry found for this symbol.';
        });
      });
    } else {
      symbolsSection.classList.add('hidden');
    }
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

// Share
document.getElementById('shareBtn').addEventListener('click', async () => {
  const dream = document.getElementById('dreamInput').value.trim();
  const interpretation = document.getElementById('result').textContent;
  const canvas = document.getElementById('shareCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 1080;
  canvas.height = 1080;

  ctx.fillStyle = '#1e1b35';
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.strokeStyle = '#8b9ed4';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 1020, 1020);
  ctx.fillStyle = '#d4a843';
  ctx.font = '700 36px serif';
  ctx.textAlign = 'center';
  ctx.fillText('METAPHYSICAL DREAM KEYS', 540, 100);
  ctx.strokeStyle = '#3d3472';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 120);
  ctx.lineTo(1000, 120);
  ctx.stroke();
  ctx.fillStyle = '#8b9ed4';
  ctx.font = '500 22px serif';
  ctx.textAlign = 'left';
  ctx.fillText('Dream:', 80, 165);
  ctx.fillStyle = '#f0eefc';
  ctx.font = '400 20px serif';
  const dreamLines = wrapText(ctx, dream.substring(0, 300) + (dream.length > 300 ? '...' : ''), 80, 195, 920, 28);
  const interpY = 195 + (dreamLines * 28) + 30;
  ctx.fillStyle = '#8b9ed4';
  ctx.font = '500 22px serif';
  ctx.fillText('Interpretation:', 80, interpY);
  ctx.fillStyle = '#f0eefc';
  ctx.font = '400 20px serif';
  const shortInterp = interpretation.substring(0, 600) + (interpretation.length > 600 ? '...' : '');
  wrapText(ctx, shortInterp, 80, interpY + 30, 920, 28);
  ctx.fillStyle = '#9b7fa8';
  ctx.font = '400 18px serif';
  ctx.textAlign = 'center';
  ctx.fillText('metaphysicaldreamkeys.com', 540, 1030);

  if (navigator.canShare) {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'dream-interpretation.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Metaphysical Dream Keys',
            text: 'My dream interpretation from Metaphysical Dream Keys',
            files: [file]
          });
        } catch (e) {
          if (e.name !== 'AbortError') downloadCanvas(canvas);
        }
      } else {
        downloadCanvas(canvas);
      }
    }, 'image/png');
  } else {
    downloadCanvas(canvas);
  }
});

function downloadCanvas(canvas) {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'dream-interpretation-card.png';
  a.click();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
      if (y > 980) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  lineCount++;
  return lineCount;
}
// Download journal
document.getElementById('downloadJournalBtn').addEventListener('click', () => {
  const journal = JSON.parse(localStorage.getItem('dreamJournal') || '[]');
  if (journal.length === 0) { alert('Your journal is empty.'); return; }
  const content = journal.map((entry, i) =>
    `ENTRY ${i + 1} — ${entry.date}\n${'='.repeat(40)}\nDREAM\n-----\n${entry.dream}\n\nINTERPRETATION\n--------------\n${entry.interpretation}`
  ).join('\n\n' + '='.repeat(40) + '\n\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dream-journal.txt';
  a.click();
  URL.revokeObjectURL(url);
});
