<script>
  import Bookmarks from '../landing/Bookmarks.svelte';
  import { setPlayer } from '../../lib/appStore';

  export let open = false;
  export let onClose = () => {};

  function handleSelect(name, tag, region, mode) {
    setPlayer({ name, tag, region, mode, fetching: true, loaded: false });
    onClose();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="bm-overlay" class:open={open} on:click|self={onClose}>
  <div class="bm-modal">
    <div class="bm-modal-header">
      <div class="bm-modal-title">★ Bookmarked Players</div>
      <button class="bm-modal-close" on:click={onClose}>&#10005;</button>
    </div>
    <div class="bm-modal-body">
      <Bookmarks onSelect={handleSelect} />
    </div>
  </div>
</div>

<style>
  .bm-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 10000;
    align-items: center;
    justify-content: center;
  }
  .bm-overlay.open { display: flex; }

  .bm-modal {
    max-width: 400px;
    width: 95%;
    background: linear-gradient(180deg, var(--surface, #0b0b0e) 0%, rgba(20,20,20,0.98) 100%);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  }

  .bm-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 215, 0, 0.15);
  }

  .bm-modal-title {
    color: #ffd700;
    font-size: 20px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .bm-modal-close {
    background: none;
    border: none;
    color: var(--muted, #a0a0ab);
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .bm-modal-close:hover { color: #fff; background: rgba(255,255,255,0.08); }

  .bm-modal-body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }
</style>
