<script>
  export let stats = null;

  $: kd = stats?.kd?.toFixed(2) ?? '—';
  $: avgKills = stats?.avgKills?.toFixed(1) ?? '—';
  $: avgDeaths = stats?.avgDeaths?.toFixed(1) ?? '—';
  $: avgAssists = stats?.avgAssists?.toFixed(1) ?? '—';
  $: avgACS = stats?.avgACS ?? '—';
  $: hsRate = stats?.hsRate != null ? stats.hsRate + '%' : '—%';
  $: winRate = stats?.winRate ?? '—';
  $: wins = stats?.wins ?? '—';
  $: losses = stats?.losses ?? '—';
  $: total = (stats?.wins ?? 0) + (stats?.losses ?? 0);
  $: wrPercent = stats?.winRate ?? 0;
</script>

<div class="stat-section">
  <!-- Combat Section Header -->
  <div class="section-label">
    <span class="sl-text">Combat</span>
    <span class="sl-line"></span>
    <span class="sl-num">01</span>
  </div>

  <div class="stat-grid">
    <div class="stat-card clickable">
      <div class="card-accent-line"></div>
      <div class="card-label">K/D Ratio</div>
      <div class="card-val">{kd}</div>
      <div class="card-sub">Competitive</div>
    </div>
    <div class="stat-card clickable">
      <div class="card-accent-line"></div>
      <div class="card-label">Avg Kills</div>
      <div class="card-val">{avgKills}</div>
      <div class="card-sub">Per match</div>
    </div>
    <div class="stat-card clickable">
      <div class="card-accent-line"></div>
      <div class="card-label">Avg Deaths</div>
      <div class="card-val">{avgDeaths}</div>
      <div class="card-sub">Per match</div>
    </div>
    <div class="stat-card clickable">
      <div class="card-accent-line"></div>
      <div class="card-label">Avg Assists</div>
      <div class="card-val">{avgAssists}</div>
      <div class="card-sub">Per match</div>
    </div>
    <div class="stat-card clickable">
      <div class="card-accent-line"></div>
      <div class="card-label">Avg ACS</div>
      <div class="card-val">{avgACS}</div>
      <div class="card-sub">Combat Score</div>
    </div>
    <div class="stat-card clickable">
      <div class="card-accent-line"></div>
      <div class="card-label">HS Rate</div>
      <div class="card-val">{hsRate}</div>
      <div class="card-sub">Headshots</div>
    </div>
  </div>

  <!-- Performance Section Header -->
  <div class="section-label">
    <span class="sl-text">Performance</span>
    <span class="sl-line"></span>
    <span class="sl-num">02</span>
  </div>

  <div class="wr-grid">
    <div class="stat-card wr-card">
      <div class="card-accent-line"></div>
      <div class="card-label">Win Rate</div>
      <div class="wr-big">{winRate}%</div>
      <div class="wr-bar-wrap">
        <div class="wr-track">
          <div class="wr-fill" style="width: {wrPercent}%"></div>
        </div>
      </div>
      <div class="wl-grid">
        <div class="wl-block wins">
          <div class="wlv">{wins}</div>
          <div class="wll">Wins</div>
        </div>
        <div class="wl-block losses">
          <div class="wlv">{losses}</div>
          <div class="wll">Losses</div>
        </div>
      </div>
      <div class="card-sub wr-detail">{total} matches tracked</div>
    </div>
  </div>
</div>

<style>
  .stat-section {
    padding: 0 0 8px;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 2px 10px;
    opacity: 1;
  }

  .sl-text {
    font-family: 'Exo 2', sans-serif;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
  }

  .sl-line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
  }

  .sl-num {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    letter-spacing: 1px;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }

  .stat-card {
    background: rgba(18, 18, 24, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .stat-card:hover {
    border-color: rgba(255, 255, 255, 0.14);
    transform: translate3d(0, -3px, 0) scale(1.003);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  }

  .stat-card.clickable {
    cursor: pointer;
  }

  .stat-card.clickable:hover {
    border-color: rgba(250, 68, 84, 0.35);
  }

  .stat-card.clickable::after {
    content: '↗';
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 11px;
    color: var(--muted2);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .stat-card.clickable:hover::after {
    opacity: 0.8;
  }

  .card-accent-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent);
    opacity: 0;
    transition: opacity 0.25s;
  }

  .stat-card:hover .card-accent-line {
    opacity: 0.75;
  }

  .card-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }

  .card-val {
    font-family: 'Exo 2', 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 44px;
    line-height: 1;
    letter-spacing: -1px;
    color: var(--text);
  }

  .card-sub {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    margin-top: 4px;
    letter-spacing: 0.5px;
  }

  /* Win Rate Card */
  .wr-grid {
    display: grid;
    grid-template-columns: 4fr 8fr;
    gap: 10px;
  }

  .wr-card {
    padding: 20px;
  }

  .wr-big {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 64px;
    line-height: 1;
    letter-spacing: -2px;
    color: var(--text);
  }

  .wr-bar-wrap {
    margin: 12px 0 10px;
  }

  .wr-track {
    height: 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
    overflow: hidden;
  }

  .wr-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
    transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .wl-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
  }

  .wl-block {
    background: var(--surface2);
    border-radius: 8px;
    padding: 10px 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .wlv {
    font-family: 'Exo 2', sans-serif;
    font-weight: 800;
    font-size: 28px;
    line-height: 1;
  }

  .wll {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.5px;
    margin-top: 3px;
  }

  .wins .wlv {
    color: var(--win);
  }

  .losses .wlv {
    color: var(--loss);
  }

  .wr-detail {
    margin-top: 8px;
  }

  .placeholder-card {
    background: rgba(18, 18, 24, 0.92);
    border: 1px dashed rgba(255, 255, 255, 0.09);
    border-radius: 12px;
    padding: 20px;
  }

  .placeholder-txt {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted2);
    letter-spacing: 1px;
    text-align: center;
    padding: 30px;
  }

  @media (max-width: 900px) {
    .stat-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    .wr-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .stat-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .card-val {
      font-size: 32px;
    }
    .wr-big {
      font-size: 48px;
    }
  }
</style>
