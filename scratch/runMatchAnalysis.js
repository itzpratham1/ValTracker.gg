function runMatchAnalysis(idx, e) {
  e.stopPropagation(); // don't close the panel

  if (_matchAnalysisCache[idx]) {
    // Already done — just re-show
    document.getElementById(`mai-body-${idx}`).innerHTML = _matchAnalysisCache[idx];
    document.getElementById(`mai-body-${idx}`).classList.add('active');
    return;
  }

  const btn     = document.getElementById(`mai-btn-${idx}`);
  const loading = document.getElementById(`mai-loading-${idx}`);
  const body    = document.getElementById(`mai-body-${idx}`);

  btn.disabled = true;
  loading.classList.add('active');
  body.classList.remove('active');

  const loadingMsgs = ['ANALYSING MATCH...','READING COMBAT DATA...','BUILDING REPORT...'];
  let mi = 0;
  const iv = setInterval(() => {
    document.getElementById(`mai-loading-txt-${idx}`).textContent = loadingMsgs[++mi % loadingMsgs.length];
  }, 700);

  await new Promise(r => setTimeout(r, 600));

  try {
    // Pull the raw match from stored data by index
    const allMatches = await loadAllMatches();
    const match = allMatches[idx];
    if (!match) throw new Error('Match not found in storage');

    const html = buildMatchAnalysis(match);
    _matchAnalysisCache[idx] = html;
    body.innerHTML = html;
    body.classList.add('active');
    btn.innerHTML = '🔄 Re-analyse';
  } catch(e) {
    body.innerHTML = `<div class="no-detail" style="color:var(--loss)">Analysis error: ${e.message}</div>`;
    body.classList.add('active');
  } finally {
    clearInterval(iv);
    loading.classList.remove('active');
    btn.disabled = false;
  }
}