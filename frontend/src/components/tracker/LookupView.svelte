<script>
  import SearchForm from '../landing/SearchForm.svelte';
  import Bookmarks from '../landing/Bookmarks.svelte';
  import RecentSearches from '../landing/RecentSearches.svelte';

  function handleSelect(name, tag, region, mode) {
    window.location.href = `/app?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&region=${region}&mode=${mode}`;
  }
</script>

<div class="lookup-container">
  <div class="lookup-noise"></div>
  <div class="lookup-corners">
    <div class="lookup-corner tl"></div>
    <div class="lookup-corner tr"></div>
    <div class="lookup-corner bl"></div>
    <div class="lookup-corner br"></div>
  </div>

  <h1 class="lookup-logo">
    <img src="/logo.png" class="logo-icon" alt="ValTracker Logo">
    <span>ValTracker</span>
  </h1>
  <div class="lookup-tagline">Valorant Performance Tracker</div>

  <div class="lookup-columns-wrap">
    <div class="lookup-card">
      <SearchForm onSearch={handleSelect} />
    </div>

    <div class="lookup-card">
      <div class="history-card-inner">
        <Bookmarks onSelect={handleSelect} />
        <RecentSearches onSelect={handleSelect} />
      </div>
    </div>
  </div>
</div>

<style>
  .lookup-container {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    background: radial-gradient(circle at 50% 0%, #111019 0%, #050508 100%);
    box-sizing: border-box;
    overflow-y: auto;
  }

  .lookup-noise {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }

  .lookup-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0;
    margin-bottom: 8px;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 700;
    font-size: 42px;
    letter-spacing: 3px;
    color: #fff;
    text-transform: uppercase;
    z-index: 2;
  }

  .lookup-logo img {
    height: 48px;
    width: auto;
    margin-right: 16px;
    filter: drop-shadow(0 0 12px rgba(255, 70, 85, 0.7));
  }

  .lookup-logo span {
    background: linear-gradient(135deg, #fff 0%, #ff4655 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .lookup-tagline {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: #8b8b9a;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 40px;
    z-index: 2;
  }

  .lookup-columns-wrap {
    display: flex;
    gap: 20px;
    max-width: 900px;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    z-index: 2;
  }

  .lookup-card {
    margin: 0;
    flex: 1;
    min-width: 320px;
    max-width: 440px;
    position: relative;
  }

  .history-card-inner {
    background: rgba(10, 10, 14, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 400px;
    box-sizing: border-box;
  }

  .lookup-corners {
    position: absolute;
    inset: 20px;
    pointer-events: none;
    z-index: 1;
  }
  .lookup-corner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 70, 85, 0.2);
  }
  .tl { top: 0; left: 0; border-right: none; border-bottom: none; }
  .tr { top: 0; right: 0; border-left: none; border-bottom: none; }
  .bl { bottom: 0; left: 0; border-right: none; border-top: none; }
  .br { bottom: 0; right: 0; border-left: none; border-top: none; }
</style>
