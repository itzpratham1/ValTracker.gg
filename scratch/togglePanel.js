function togglePanel(idx,matchId){
  const row=document.getElementById(`mrow-${idx}`);
  const panel=document.getElementById(`mpanel-${idx}`);
  const isOpen=panel.classList.contains('open');
  document.querySelectorAll('.match-panel.open').forEach(p=>p.classList.remove('open'));
  document.querySelectorAll('.match-row.open').forEach(r=>r.classList.remove('open'));
  if(!isOpen){
    row.classList.add('open');
    panel.classList.add('open');
    if(matchId&&!panel.dataset.detailLoaded){
      panel.dataset.detailLoaded='1';
      const perfEl = document.getElementById(`tabcontent-${idx}-performance`);
      const duelsEl = document.getElementById(`tabcontent-${idx}-duels`);
      const timeEl  = document.getElementById(`tabcontent-${idx}-timeline`);
      if(perfEl) perfEl.innerHTML = '<div class="detail-loading">Loading performance data...</div>';
      if(duelsEl) duelsEl.innerHTML = '<div class="detail-loading">Loading fight duels...</div>';
      if(timeEl) timeEl.innerHTML = '<div class="detail-loading">Loading round timelines...</div>';
      try{
        const res=await fetch(`/api/v2/match/${matchId}`);
        if(res.ok){
          const data=await res.json();
          if(data?.data) {
            populateFullDetailTabs(data.data, idx);
          } else {
            const err = '<div class="no-detail">Match detail not available</div>';
            if(perfEl) perfEl.innerHTML = err;
            if(duelsEl) duelsEl.innerHTML = err;
            if(timeEl) timeEl.innerHTML = err;
          }
        } else {
          const err = `<div class="no-detail">Fetch error ${res.status}</div>`;
          if(perfEl) perfEl.innerHTML = err;
          if(duelsEl) duelsEl.innerHTML = err;
          if(timeEl) timeEl.innerHTML = err;
        }
      } catch(e) {
        const err = '<div class="no-detail">Network error — click again to retry</div>';
        panel.dataset.detailLoaded = '';
        if(perfEl) perfEl.innerHTML = err;
        if(duelsEl) duelsEl.innerHTML = err;
        if(timeEl) timeEl.innerHTML = err;
      }
    }
  }
}