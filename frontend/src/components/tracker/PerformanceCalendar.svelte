<script>
  export let allMatches = [];
  export let mmrHistory = {};
  export let playerName = '';
  export let playerTag = '';

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_LABELS = ['S','M','T','W','T','F','S'];

  function formatDate(d) {
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  }

  function getCellColor(data) {
    if (!data || data.games === 0) return '#1a1a1f'; // gray - no games
    const rr = data.rrDelta;
    // Green: dark muted → dark → medium → bright (increasing RR gained)
    if (rr >= 60) return '#3ecf8e';   // brightest green  — most gained
    if (rr >= 30) return '#22a85f';   // medium green
    if (rr >= 10) return '#1a6b42';   // dark green
    if (rr >= 0)  return '#0f3d26';   // darkest muted green — barely gained
    // Red: dark muted → medium → bright (increasing RR lost)
    if (rr >= -15) return '#3d1a1e';  // darkest muted red — barely lost
    if (rr >= -40) return '#8a2028';  // medium red
    return '#c0272f';                  // brightest red — most lost
  }

  function buildDayMap(matches, hist, pName, pTag) {
    const dayMap = {};
    matches.forEach(match => {
      const ts = (match.metadata?.game_start || match.metadata?.gameStart || 0) * 1000;
      if (!ts) return;
      const date = new Date(ts);
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const rawPlayers = match.players?.all_players || match.players || [];
      const players = Array.isArray(rawPlayers) ? rawPlayers : [];
      const me = players.find(p =>
        p.name?.toLowerCase() === pName?.toLowerCase() &&
        p.tag?.toLowerCase() === pTag?.toLowerCase()
      ) || players[0];
      const won = me ? (match.teams?.[(me.team || '').toLowerCase()]?.has_won || false) : false;
      const matchId = match.metadata?.matchid || match.metadata?.match_id;
      const rrChange = hist[matchId] ?? (won ? 20 : -15);
      if (!dayMap[key]) dayMap[key] = { rrDelta: 0, wins: 0, losses: 0, games: 0 };
      dayMap[key].rrDelta += rrChange;
      dayMap[key].games++;
      if (won) dayMap[key].wins++; else dayMap[key].losses++;
    });
    return dayMap;
  }

  function buildGrid(dayMap) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Anchor to the Sunday of the current week so today is always in the last column
    const endWeekSunday = new Date(today);
    endWeekSunday.setDate(today.getDate() - today.getDay());

    // Start = 15 weeks before that Sunday → 16 total columns, last = current week
    const start = new Date(endWeekSunday);
    start.setDate(endWeekSunday.getDate() - 15 * 7);

    const cells = [];
    for (let week = 0; week < 16; week++) {
      for (let day = 0; day < 7; day++) {
        const d = new Date(start);
        d.setDate(start.getDate() + week * 7 + day);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        cells.push({ date: d, key, data: dayMap[key] || null, week, day, isFuture: d > today });
      }
    }
    return { cells, start, today };
  }

  function buildMonthLabels(start) {
    const labels = [];
    const seen = new Set();
    for (let week = 0; week < 16; week++) {
      const d = new Date(start);
      d.setDate(start.getDate() + week * 7);
      const mo = d.getMonth();
      if (!seen.has(mo)) {
        seen.add(mo);
        labels.push({ week, label: MONTH_NAMES[mo] });
      } else {
        labels.push({ week, label: '' });
      }
    }
    return labels;
  }

  function computeSummary(cells) {
    let totalGames = 0, netRR = 0, peakRR = 0, peakDay = '';
    cells.forEach(c => {
      if (!c.data) return;
      totalGames += c.data.games;
      netRR += c.data.rrDelta;
      if (c.data.rrDelta > peakRR) {
        peakRR = c.data.rrDelta;
        peakDay = formatDate(c.date);
      }
    });
    return { totalGames, netRR, peakRR, peakDay };
  }

  $: dayMap = buildDayMap(allMatches, mmrHistory, playerName, playerTag);
  $: gridData = buildGrid(dayMap);
  $: cells = gridData.cells;
  $: gridStart = gridData.start;
  $: monthLabels = buildMonthLabels(gridStart);
  $: summary = computeSummary(cells);

  // Legend arrays ordered light→dark matching ascending RR thresholds
  const LEGEND_GREEN = ['#0f3d26', '#1a6b42', '#22a85f', '#3ecf8e'];
  const LEGEND_RED   = ['#3d1a1e', '#8a2028', '#c0272f'];
</script>

<div class="card perf-calendar-card visible">
  <div class="card-accent-line"></div>

  <div class="perf-cal-header">
    <div class="card-label">Activity &amp; RR Calendar</div>
    <div class="cal-legend">
      <!-- No games -->
      <div class="cal-legend-cell" style="background:#1a1a1f;" title="No games played"></div>
      <span class="cal-legend-label">No games</span>

      <div class="cal-legend-sep"></div>

      <!-- RR gained -->
      {#each LEGEND_GREEN as color}
        <div class="cal-legend-cell" style="background:{color};"></div>
      {/each}
      <span class="cal-legend-label">RR gained</span>

      <div class="cal-legend-sep"></div>

      <!-- RR lost -->
      {#each LEGEND_RED as color}
        <div class="cal-legend-cell" style="background:{color};"></div>
      {/each}
      <span class="cal-legend-label">RR lost</span>
    </div>
  </div>

  <div class="cal-grid-wrap">
    <div class="cal-day-labels">
      {#each DAY_LABELS as lbl, i}
        <div class="cal-day-lbl">{i % 2 === 1 ? lbl : ''}</div>
      {/each}
    </div>

    <div class="cal-grid-col">
      <div class="cal-month-labels">
        {#each monthLabels as ml}
          <div class="cal-month-lbl" style="grid-column:{ml.week + 1};">{ml.label}</div>
        {/each}
      </div>

      <div class="cal-grid">
        {#each cells as cell}
          <div
            class="cal-cell{cell.isFuture ? ' cal-future' : ''}"
            style="background:{getCellColor(cell.data)};grid-column:{cell.week + 1};grid-row:{cell.day + 1};"
            title={cell.data
              ? `${formatDate(cell.date)} · ${cell.data.rrDelta > 0 ? '+' : ''}${cell.data.rrDelta} RR · ${cell.data.wins}W ${cell.data.losses}L`
              : formatDate(cell.date)}
          ></div>
        {/each}
      </div>
    </div>
  </div>

  <div class="cal-summary">
    <span>{summary.totalGames} games in last 16 weeks</span>
    <span class:pos={summary.netRR >= 0} class:neg={summary.netRR < 0}>
      {summary.netRR > 0 ? '+' : ''}{summary.netRR} total RR
    </span>
    {#if summary.peakDay}
      <span>Peak day: {summary.peakDay} (+{summary.peakRR} RR)</span>
    {/if}
  </div>
</div>
