<script>
  import { onMount, onDestroy } from 'svelte';
  import { escapeJsString } from '../../lib/utils';

  export let bundles = [];
  export let bundleMeta = [];
  export let onSkinByName = () => {};

  let bundleTimers = [];
  let secondsRemainingMap = {};

  onMount(() => {
    initTimers();
    return () => clearTimers();
  });

  onDestroy(() => {
    clearTimers();
  });

  function clearTimers() {
    bundleTimers.forEach(t => clearInterval(t));
    bundleTimers = [];
  }

  function initTimers() {
    clearTimers();
    bundles.forEach((b, idx) => {
      secondsRemainingMap[idx] = b.seconds_remaining || 0;
      const interval = setInterval(() => {
        if (secondsRemainingMap[idx] <= 0) {
          secondsRemainingMap[idx] = 0;
          return;
        }
        secondsRemainingMap[idx]--;
      }, 1000);
      bundleTimers.push(interval);
    });
  }

  function formatCountdown(totalSeconds) {
    if (totalSeconds <= 0) return "EXPIRED";
    const d = Math.floor(totalSeconds / (3600 * 24));
    const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${d}D ${h}H ${m}M ${s}S`;
  }

  function getBundleName(uuid) {
    const meta = bundleMeta.find(x => x.uuid === uuid);
    return meta ? meta.displayName : "Featured Bundle Offer";
  }

  function getDiscountInfo(item) {
    const discountPct = item.discount_percent ? Math.round(item.discount_percent * 100) : 0;
    const discountedPrice = item.discounted_price || item.base_price || 0;
    return { discountPct, discountedPrice };
  }

  function isSkinItem(item) {
    return item.type === 'skin' || item.type === 'skin_level';
  }

  function handleItemClick(item) {
    if (isSkinItem(item)) {
      onSkinByName(item.name);
    }
  }
</script>

{#each bundles as bundle, idx}
  <div class="card featured-bundle">
    <div class="featured-bundle-header">
      <div>
        <div class="featured-bundle-name">
          <span class="featured-bundle-dot"></span>
          {getBundleName(bundle.bundle_uuid)}
        </div>
        <div class="featured-bundle-uuid">UUID: {bundle.bundle_uuid.substring(0, 8)}...</div>
      </div>

      <div class="featured-bundle-meta">
        <div class="featured-bundle-meta-item">
          <div class="featured-bundle-meta-label">Bundle Price</div>
          <div class="featured-bundle-price">&#129689; {bundle.bundle_price} VP</div>
        </div>
        <div class="featured-bundle-meta-item featured-bundle-meta-divider">
          <div class="featured-bundle-meta-label">Bundle Expiry</div>
          <div class="featured-bundle-countdown">
            {formatCountdown(secondsRemainingMap[idx] || 0)}
          </div>
        </div>
      </div>
    </div>

    <div class="featured-bundle-items">
      {#each bundle.items || [] as item}
        {@const { discountPct, discountedPrice } = getDiscountInfo(item)}
        <div
          class="store-item-card"
          class:clickable={isSkinItem(item)}
          on:click={() => handleItemClick(item)}
        >
          {#if discountPct > 0}
            <div class="store-item-discount-badge">-{discountPct}%</div>
          {/if}
          <div class="store-item-img-wrap">
            {#if item.image}
              <img src={item.image} alt={item.name} class="store-item-img" />
            {:else}
              <div class="store-item-fallback">{item.name.substring(0, 2).toUpperCase()}</div>
            {/if}
          </div>
          <div class="store-item-info">
            <div class="store-item-name" title={item.name}>{item.name}</div>
            <div class="store-item-price">
              {#if discountPct > 0}
                <span class="store-item-original-price">{item.base_price}</span>
              {/if}
              <span class="store-item-final-price">{discountedPrice} VP</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/each}

<style>
  .featured-bundle {
    padding: 20px;
    border-radius: 12px;
    background: rgba(20, 20, 22, 0.45);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .featured-bundle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .featured-bundle-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 18px;
    text-transform: uppercase;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .featured-bundle-dot {
    width: 8px;
    height: 8px;
    background: var(--accent);
    border-radius: 50%;
  }

  .featured-bundle-uuid {
    font-size: 11px;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    margin-top: 2px;
  }

  .featured-bundle-meta {
    display: flex;
    gap: 16px;
  }

  .featured-bundle-meta-item {
    text-align: right;
  }

  .featured-bundle-meta-label {
    font-size: 9px;
    color: var(--muted);
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
  }

  .featured-bundle-price {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 20px;
    color: #ffb700;
    text-shadow: 0 0 10px rgba(255,183,0,0.25);
  }

  .featured-bundle-meta-divider {
    border-left: 1px solid rgba(255,255,255,0.08);
    padding-left: 16px;
  }

  .featured-bundle-countdown {
    font-family: 'DM Mono', monospace;
    font-weight: 800;
    font-size: 14px;
    color: var(--accent);
    text-shadow: 0 0 8px rgba(250,68,84,0.3);
    margin-top: 4px;
  }

  .featured-bundle-items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 16px;
  }

  .store-item-card {
    min-height: 115px;
    padding: 10px;
    position: relative;
    background: rgba(255,255,255,0.015);
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .store-item-card.clickable {
    cursor: pointer;
  }

  .store-item-discount-badge {
    position: absolute;
    top: 6px;
    left: 6px;
    background: var(--win);
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 800;
    color: #fff;
    padding: 2px 6px;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(62,207,142,0.3);
    z-index: 2;
  }

  .store-item-img-wrap {
    height: 55px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .store-item-img {
    width: 100%;
    height: 55px;
    object-fit: contain;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
    transition: all 0.2s;
  }

  .store-item-fallback {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255,255,255,0.03);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px;
    font-weight: 900;
    color: var(--accent);
  }

  .store-item-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 100%;
  }

  .store-item-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 11px;
    color: #fff;
    text-transform: uppercase;
    text-align: center;
    line-height: 1.1;
    max-width: 98%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .store-item-price {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
  }

  .store-item-original-price {
    text-decoration: line-through;
    font-size: 10px;
    color: var(--muted);
    margin-right: 6px;
  }

  .store-item-final-price {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 800;
    color: var(--accent);
  }
</style>
