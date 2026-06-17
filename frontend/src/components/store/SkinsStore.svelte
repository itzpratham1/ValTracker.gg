<script>
  import { onMount, onDestroy } from 'svelte';
  import { currentView } from '../../lib/appStore';
  import { fetchStoreFeatured } from '../../lib/api';
  import FeaturedBundles from './FeaturedBundles.svelte';
  import SkinModal from './SkinModal.svelte';

  let featuredBundles = [];
  let bundleMeta = [];
  let allSkinsList = [];
  let filteredSkinsList = [];
  let loadingBundles = true;
  let loadingSkins = true;
  let error = null;

  let searchQuery = '';
  let weaponFilter = 'all';
  let rarityFilter = 'all';

  const skinCatalogPageSize = 24;
  let currentSkinCatalogIndex = 0;

  let selectedSkin = null;
  let modalOpen = false;

  $: isVisible = $currentView === 'store';

  $: if (isVisible) {
    initStore();
  }

  onMount(() => {
    return () => {};
  });

  async function initStore() {
    if (featuredBundles.length === 0 && loadingBundles) {
      loadFeaturedBundles();
    }
    if (allSkinsList.length === 0 && loadingSkins) {
      loadSkinsCatalog();
    }
  }

  async function loadFeaturedBundles() {
    loadingBundles = true;
    error = null;

    try {
      const json = await fetchStoreFeatured();
      if (json.data && json.data.length > 0) {
        featuredBundles = json.data;
      } else {
        featuredBundles = getFallbackBundles();
      }
    } catch (err) {
      console.warn("Store API failed, using fallback:", err);
      featuredBundles = getFallbackBundles();
    }

    loadingBundles = false;

    try {
      const res = await fetch('https://valorant-api.com/v1/bundles');
      const json = await res.json();
      if (json.data) bundleMeta = json.data;
    } catch (err) {
      console.error("Bundle metadata load failed:", err);
    }
  }

  async function loadSkinsCatalog() {
    loadingSkins = true;

    try {
      const res = await fetch('https://valorant-api.com/v1/weapons/skins');
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        allSkinsList = json.data.filter(s =>
          s.displayIcon &&
          !s.displayName.toLowerCase().startsWith('standard') &&
          !s.displayName.toLowerCase().includes('default') &&
          s.themeUuid !== "5a62f6b5-4b0d-c0df-d3ca-9dab2686f107"
        );
        allSkinsList.sort((a, b) => a.displayName.localeCompare(b.displayName));
        filteredSkinsList = [...allSkinsList];
        currentSkinCatalogIndex = 0;
      }
    } catch (err) {
      console.error("Skins catalog load failed:", err);
      error = "Failed to connect to the skin catalog server.";
    }

    loadingSkins = false;
  }

  function getFallbackBundles() {
    return [
      {
        "bundle_uuid": "602900ed-4e10-d214-acc5-8883ed2430f5",
        "bundle_price": 8700,
        "seconds_remaining": 1600000,
        "expires_at": "2026-06-17T17:59:59.023Z",
        "items": [
          { "uuid": "b987198e-40da-cbc3-8cd2-1abd36d3a983", "name": "Rogue Buddy", "image": "https://media.valorant-api.com/buddies/b987198e-40da-cbc3-8cd2-1abd36d3a983/displayicon.png", "type": "buddy", "base_price": 475, "discount_percent": 1.0, "discounted_price": 0 },
          { "uuid": "c429531b-4980-ca36-c3e0-689d1cbcaf6f", "name": "Rogue Card", "image": "https://media.valorant-api.com/playercards/c429531b-4980-ca36-c3e0-689d1cbcaf6f/displayicon.png", "type": "player_card", "base_price": 375, "discount_percent": 1.0, "discounted_price": 0 },
          { "uuid": "67908139-4960-5f8f-ccbf-d2a96eea1ea8", "name": "Rogue Spray", "image": "https://media.valorant-api.com/sprays/67908139-4960-5f8f-ccbf-d2a96eea1ea8/displayicon.png", "type": "spray", "base_price": 325, "discount_percent": 1.0, "discounted_price": 0 },
          { "uuid": "1b9b0131-42fe-b6a7-d212-699b342ba642", "name": "Rogue Vandal", "image": "https://media.valorant-api.com/weaponskins/1b9b0131-42fe-b6a7-d212-699b342ba642/displayicon.png", "type": "skin_level", "base_price": 2175, "discount_percent": 0.0, "discounted_price": 2175 },
          { "uuid": "ea3e6c8a-4e5e-baf9-33c3-7abacf07aaee", "name": "Rogue Bucky", "image": "https://media.valorant-api.com/weaponskins/ea3e6c8a-4e5e-baf9-33c3-7abacf07aaee/displayicon.png", "type": "skin_level", "base_price": 2175, "discount_percent": 0.0, "discounted_price": 2175 },
          { "uuid": "902a3bcb-4164-3315-fe03-2088fb897ce4", "name": "Rogue Bandit", "image": "https://media.valorant-api.com/weaponskins/902a3bcb-4164-3315-fe03-2088fb897ce4/displayicon.png", "type": "skin_level", "base_price": 2175, "discount_percent": 0.0, "discounted_price": 2175 },
          { "uuid": "2460c852-4d1b-a9e3-ccda-43a8e30cb739", "name": "Rogue Operator", "image": "https://media.valorant-api.com/weaponskins/2460c852-4d1b-a9e3-ccda-43a8e30cb739/displayicon.png", "type": "skin_level", "base_price": 2175, "discount_percent": 0.0, "discounted_price": 2175 },
          { "uuid": "1c808469-4aee-ae6c-fcd2-1099e96ac6a0", "name": "Rogue Push Daggers", "image": "https://media.valorant-api.com/weaponskins/1c808469-4aee-ae6c-fcd2-1099e96ac6a0/displayicon.png", "type": "skin_level", "base_price": 4350, "discount_percent": 1.0, "discounted_price": 0 }
        ]
      }
    ];
  }

  function getSkinRarityTier(tierUuid) {
    const tiers = {
      "12683d76-48d7-84a3-4e11-5be5b4574b72": { name: "Select Edition", shortName: "select", color: "#3ecf8e", price: 875, meleePrice: 1750, icon: "\u{1F7E2}" },
      "0cebb8be-46e7-c15a-e1d5-89f58f5d883b": { name: "Deluxe Edition", shortName: "deluxe", color: "#00b2ff", price: 1275, meleePrice: 2550, icon: "\u{1F535}" },
      "607b0394-4343-4343-d2df-8b9ed9381734": { name: "Premium Edition", shortName: "premium", color: "#d154ff", price: 1775, meleePrice: 3550, icon: "\u{1F7E3}" },
      "11111111-1111-1111-1111-111111111111": { name: "Ultra Edition", shortName: "ultra", color: "#ffb700", price: 2175, meleePrice: 4350, icon: "\u{1F7E1}" },
      "e046854e-406c-37f4-660d-419b228b7684": { name: "Ultra Edition", shortName: "ultra", color: "#ffb700", price: 2175, meleePrice: 4350, icon: "\u{1F7E1}" },
      "411e4e55-4e59-7757-41a0-bf9e228b7634": { name: "Exclusive Edition", shortName: "exclusive", color: "#fa4454", price: 2175, meleePrice: 4350, icon: "\u{1F534}" }
    };
    return tiers[tierUuid] || { name: "Exclusive Edition", shortName: "exclusive", color: "#fa4454", price: 1775, meleePrice: 3550, icon: "\u{1F534}" };
  }

  function handleSearch() {
    filteredSkinsList = allSkinsList.filter(s => {
      const nameMatches = s.displayName.toLowerCase().includes(searchQuery.toLowerCase());

      let weaponMatches = true;
      if (weaponFilter !== 'all') {
        const dn = s.displayName.toLowerCase();
        if (weaponFilter === 'melee') {
          weaponMatches = dn.includes('melee') || dn.includes('knife') || dn.includes('axe') || dn.includes('dagger') || dn.includes('blade') || dn.includes('bat') || dn.includes('sword') || dn.includes('anchor') || dn.includes('karambit') || dn.includes('scythe');
        } else {
          weaponMatches = dn.includes(weaponFilter);
        }
      }

      let rarityMatches = true;
      if (rarityFilter !== 'all') {
        const tier = getSkinRarityTier(s.contentTierUuid);
        rarityMatches = tier.shortName.toLowerCase() === rarityFilter;
      }

      return nameMatches && weaponMatches && rarityMatches;
    });

    currentSkinCatalogIndex = 0;
  }

  function showMoreSkins() {
    currentSkinCatalogIndex += skinCatalogPageSize;
  }

  $: visibleSkins = filteredSkinsList.slice(0, currentSkinCatalogIndex + skinCatalogPageSize);
  $: hasMoreSkins = currentSkinCatalogIndex + skinCatalogPageSize < filteredSkinsList.length;

  function openSkinModal(skin) {
    selectedSkin = skin;
    modalOpen = true;
  }

  function openSkinByName(name) {
    const skin = allSkinsList.find(s => s.displayName.toLowerCase().trim() === name.toLowerCase().trim());
    if (skin) openSkinModal(skin);
  }

  function closeModal() {
    modalOpen = false;
    selectedSkin = null;
  }
</script>

<div class="store-view">
  <!-- Banner Header -->
  <div class="store-banner">
    <h2 class="store-banner-title">Valorant Store & Cosmetics Explorer</h2>
    <p class="store-banner-desc">
      Track global featured bundles with pricing in VP, live countdown timers, and browse the complete Valorant weapon skins database. Click on any skin to explore chroma color variants and watch high-definition video finisher previews inline.
    </p>
  </div>

  <!-- Store Split Grid -->
  <div class="store-grid">
    <!-- LEFT PANEL: Featured Bundles -->
    <div class="store-left-panel">
      <div class="section-label visible" style="margin-bottom: 0;">
        <span class="sl-text">Featured Store Bundles</span>
        <div class="sl-line"></div>
      </div>
      <div class="store-featured-container">
        {#if loadingBundles}
          <div class="store-loading-card">
            <div class="cyber-spinner"></div>
            <div class="store-loading-text">ESTABLISHING SECURE DECRYPTED STORE LINK...</div>
          </div>
        {:else if featuredBundles.length > 0}
          <FeaturedBundles
            bundles={featuredBundles}
            bundleMeta={bundleMeta}
            onSkinByName={openSkinByName}
          />
        {/if}
      </div>
    </div>

    <!-- RIGHT PANEL: Skins Search & Catalog Explorer -->
    <div class="store-right-panel">
      <div class="section-label visible" style="margin-bottom: 0;">
        <span class="sl-text">Weapon Skins Catalog Explorer</span>
        <div class="sl-line"></div>
      </div>

      <!-- Search & Filters Bar -->
      <div class="card store-filters">
        <div class="store-search-wrap">
          <input
            type="text"
            placeholder="Search weapon skins (e.g. Prime, Reaver, RGX)..."
            class="store-search-input"
            bind:value={searchQuery}
            on:input={handleSearch}
          />
        </div>

        <div class="store-filter-selects">
          <select bind:value={weaponFilter} on:change={handleSearch} class="store-select">
            <option value="all">All Weapons</option>
            <option value="vandal">Vandal</option>
            <option value="phantom">Phantom</option>
            <option value="sheriff">Sheriff</option>
            <option value="operator">Operator</option>
            <option value="spectre">Spectre</option>
            <option value="ghost">Ghost</option>
            <option value="classic">Classic</option>
            <option value="melee">Melee / Knives</option>
            <option value="guardian">Guardian</option>
            <option value="bulldog">Bulldog</option>
            <option value="marshal">Marshal</option>
            <option value="outlaw">Outlaw</option>
            <option value="stinger">Stinger</option>
            <option value="shorty">Shorty</option>
            <option value="frenzy">Frenzy</option>
            <option value="bucky">Bucky</option>
            <option value="judge">Judge</option>
            <option value="odin">Odin</option>
            <option value="ares">Ares</option>
          </select>

          <select bind:value={rarityFilter} on:change={handleSearch} class="store-select">
            <option value="all">All Rarities</option>
            <option value="exclusive">Exclusive (Gold)</option>
            <option value="ultra">Ultra (Purple)</option>
            <option value="premium">Premium (Pink)</option>
            <option value="deluxe">Deluxe (Blue)</option>
            <option value="select">Select (Green)</option>
          </select>
        </div>
      </div>

      <!-- Catalog grid -->
      {#if loadingSkins}
        <div class="store-loading-card">
          <div class="cyber-spinner"></div>
          <div class="store-loading-text">LOADING VALORANT SKIN CATALOG...</div>
        </div>
      {:else if error}
        <div class="store-error">{error}</div>
      {:else}
        <div class="skin-catalog-grid">
          {#each visibleSkins as skin (skin.uuid)}
            {@const tier = getSkinRarityTier(skin.contentTierUuid)}
            {@const isMelee = skin.displayName.toLowerCase().includes('melee') || skin.displayName.toLowerCase().includes('knife') || skin.displayName.toLowerCase().includes('axe')}
            <div
              class="card player-card skin-catalog-card"
              style="border-left: 3px solid {tier.color};"
              on:click={() => openSkinModal(skin)}
              on:mouseover={(e) => e.currentTarget.style.borderColor = tier.color}
              on:mouseout={(e) => e.currentTarget.style.borderColor = tier.color}
            >
              <div class="skin-card-rarity-dot" style="background:{tier.color};" title={tier.name}>&#8203;</div>
              <div class="skin-card-img-wrap">
                {#if skin.displayIcon}
                  <img
                    src={skin.displayIcon}
                    alt={skin.displayName}
                    class="skin-card-img"
                    style={isMelee ? 'max-width:70%; max-height:60px;' : ''}
                  />
                {:else}
                  <div class="skin-card-fallback">{skin.displayName.substring(0, 2).toUpperCase()}</div>
                {/if}
              </div>
              <div class="skin-card-info">
                <div class="skin-card-name" title={skin.displayName}>{skin.displayName}</div>
                <div class="skin-card-price">
                  <span>&#129689;</span>
                  {isMelee ? tier.meleePrice : tier.price} VP
                </div>
              </div>
            </div>
          {/each}
        </div>

        {#if filteredSkinsList.length === 0}
          <div class="store-empty">No skins found matching your search.</div>
        {/if}

        {#if hasMoreSkins}
          <div class="store-show-more">
            <button class="fetch-btn" on:click={showMoreSkins}>
              Load More Skins
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<SkinModal skin={selectedSkin} open={modalOpen} onClose={closeModal} />

<style>
  .store-view {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .store-banner {
    background: linear-gradient(135deg, rgba(250, 68, 84, 0.12) 0%, rgba(20, 20, 22, 0.45) 100%);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .store-banner-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 32px;
    font-weight: 900;
    text-transform: uppercase;
    color: #fff;
    letter-spacing: 1.5px;
    margin: 0;
  }

  .store-banner-desc {
    font-size: 13px;
    color: var(--muted);
    margin: 0;
    max-width: 700px;
  }

  .store-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 28px;
    margin-bottom: 30px;
  }

  .store-left-panel,
  .store-right-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .store-featured-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .store-loading-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px;
    gap: 12px;
    color: var(--muted);
    border: 1px dashed var(--border);
    border-radius: 12px;
  }

  .cyber-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid rgba(250,68,84,0.2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .store-loading-text {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .store-filters {
    padding: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    border-radius: 12px;
    background: rgba(20, 20, 22, 0.45);
    border: 1px solid var(--border);
  }

  .store-search-wrap {
    flex: 1;
    min-width: 280px;
    position: relative;
  }

  .store-search-input {
    width: 100%;
    padding: 11px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: rgba(0,0,0,0.4);
    color: #fff;
    font-size: 13px;
    outline: none;
    transition: var(--transition);
  }

  .store-search-input:focus {
    border-color: var(--accent);
  }

  .store-filter-selects {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .store-select {
    padding: 11px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: rgba(0,0,0,0.4);
    color: #fff;
    font-size: 13px;
    outline: none;
    cursor: pointer;
    transition: var(--transition);
  }

  .skin-catalog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }

  .skin-catalog-card {
    min-height: 165px;
    padding: 16px;
    background: rgba(20, 20, 22, 0.35);
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.2s cubic-bezier(0.25,0.8,0.25,1);
    position: relative;
  }

  .skin-card-rarity-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    opacity: 0.75;
    font-size: 0;
  }

  .skin-card-img-wrap {
    height: 70px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .skin-card-img {
    max-width: 90%;
    max-height: 55px;
    object-fit: contain;
    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.55));
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .skin-card-fallback {
    width: 100%;
    height: 80px;
    background: rgba(255,255,255,0.02);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 36px;
    font-weight: 900;
    color: rgba(255,255,255,0.05);
  }

  .skin-card-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    width: 100%;
  }

  .skin-card-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 12px;
    color: #fff;
    text-transform: uppercase;
    text-align: center;
    line-height: 1.2;
    max-width: 98%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .skin-card-price {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .store-empty {
    text-align: center;
    color: var(--muted);
    padding: 30px;
    font-family: 'DM Mono', monospace;
  }

  .store-error {
    text-align: center;
    color: var(--loss);
    padding: 30px;
    font-family: 'DM Mono', monospace;
  }

  .store-show-more {
    display: flex;
    justify-content: center;
    margin-top: 15px;
    margin-bottom: 30px;
  }

  @media (max-width: 992px) {
    .store-grid {
      grid-template-columns: 1fr !important;
      gap: 20px !important;
    }

    .store-view {
      padding: 14px;
    }

    .store-banner {
      padding: 16px;
    }

    .store-banner-title {
      font-size: clamp(20px, 6vw, 28px);
    }

    .store-banner-desc {
      font-size: 12px;
    }

    .skin-catalog-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }

    .store-filters {
      flex-wrap: wrap;
    }

    .store-search-wrap {
      min-width: 100%;
    }
  }

  @media (max-width: 480px) {
    .store-view {
      padding: 10px;
    }

    .skin-catalog-grid {
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
    }
  }
</style>
