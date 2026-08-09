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
        "bundle_uuid": "4d368017-4f98-1e89-dbec-31abd2533eb9",
        "bundle_price": 6700,
        "seconds_remaining": 862496,
        "expires_at": "2026-08-19T05:04:08.931Z",
        "items": [
          { "uuid": "38d47ee7-414d-8cee-5bbd-aca16656cda9", "name": "Neo Frontier Lasso", "image": "https://media.valorant-api.com/weaponskins/38d47ee7-414d-8cee-5bbd-aca16656cda9/displayicon.png", "type": "skin_level", "base_price": 4350, "discount_percent": 0.23, "discounted_price": 3350 },
          { "uuid": "5ef15ada-4332-093f-ea15-8a8891d863d0", "name": "Neo Frontier Vandal", "image": "https://media.valorant-api.com/weaponskins/5ef15ada-4332-093f-ea15-8a8891d863d0/displayicon.png", "type": "skin_level", "base_price": 2175, "discount_percent": 0.23, "discounted_price": 1675 },
          { "uuid": "de88d366-4d2b-655f-345c-719b97ddf9d9", "name": "Neo Frontier Shorty", "image": "https://media.valorant-api.com/weaponskins/de88d366-4d2b-655f-345c-719b97ddf9d9/displayicon.png", "type": "skin_level", "base_price": 2175, "discount_percent": 0.23, "discounted_price": 1675 },
          { "uuid": "e9a3d874-4893-b17a-00ca-0b88017f7919", "name": "Neo Frontier Card", "image": "https://media.valorant-api.com/playercards/e9a3d874-4893-b17a-00ca-0b88017f7919/displayicon.png", "type": "player_card", "base_price": 375, "discount_percent": 1.0, "discounted_price": 0 },
          { "uuid": "5d3cde59-4d50-e54b-9126-d7bfac8d18bc", "name": "Neo Frontier Spray", "image": "https://media.valorant-api.com/sprays/5d3cde59-4d50-e54b-9126-d7bfac8d18bc/displayicon.png", "type": "spray", "base_price": 325, "discount_percent": 1.0, "discounted_price": 0 }
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
              class="card skin-catalog-card"
              style="border-left: 3px solid {tier.color};"
              on:click={() => openSkinModal(skin)}
              on:mouseover={(e) => e.currentTarget.style.borderColor = tier.color}
              on:mouseout={(e) => e.currentTarget.style.borderColor = tier.color}
            >
              <div class="skin-card-rarity-dot" style="background:{tier.color}; box-shadow: 0 0 6px {tier.color};" title={tier.name}>&#8203;</div>
              <div class="skin-card-img-wrap">
                {#if skin.displayIcon}
                  <img
                    src={skin.displayIcon}
                    alt={skin.displayName}
                    class="skin-card-img"
                    style={isMelee ? 'max-width:70%; max-height:50px;' : ''}
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
    line-height: 1.4;
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
    flex-direction: column;
    gap: 12px;
    border-radius: 12px;
    background: rgba(20, 20, 22, 0.45);
    border: 1px solid var(--border);
  }

  .store-search-wrap {
    width: 100%;
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
    width: 100%;
  }

  .store-select {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: rgba(0,0,0,0.5);
    color: #fff;
    font-size: 12px;
    outline: none;
    cursor: pointer;
    transition: var(--transition);
  }

  .store-select:focus {
    border-color: var(--accent);
  }

  .skin-catalog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
    gap: 12px;
  }

  .skin-catalog-card {
    min-height: 140px;
    height: 100%;
    aspect-ratio: unset !important;
    padding: 14px 12px;
    background: rgba(20, 20, 22, 0.55);
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    transition: all 0.2s cubic-bezier(0.25,0.8,0.25,1);
    position: relative;
    box-sizing: border-box;
  }

  .skin-card-rarity-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    opacity: 0.9;
    font-size: 0;
    z-index: 2;
  }

  .skin-card-img-wrap {
    height: 60px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .skin-card-img {
    max-width: 95%;
    max-height: 52px;
    object-fit: contain;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.65));
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .skin-catalog-card:hover .skin-card-img {
    transform: scale(1.06);
  }

  .skin-card-fallback {
    width: 100%;
    height: 60px;
    background: rgba(255,255,255,0.02);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px;
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
    font-weight: 800;
    font-size: 12px;
    color: #fff;
    text-transform: uppercase;
    text-align: center;
    line-height: 1.1;
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

  @media (max-width: 1024px) {
    .store-grid {
      grid-template-columns: 1fr !important;
      gap: 20px !important;
    }

    .store-view {
      padding: 14px 12px;
    }

    .store-banner {
      padding: 16px;
      margin-bottom: 16px;
    }

    .store-banner-title {
      font-size: clamp(20px, 6vw, 26px);
    }

    .store-banner-desc {
      font-size: 12px;
    }

    .skin-catalog-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
      width: 100% !important;
    }

    .skin-catalog-card {
      min-width: 0 !important;
      width: 100% !important;
      min-height: 115px !important;
      padding: 10px 8px !important;
    }

    .skin-card-img-wrap {
      height: 50px;
    }

    .skin-card-img {
      max-height: 44px;
    }

    .skin-card-name {
      font-size: 11px;
    }
  }

  @media (max-width: 480px) {
    .store-view {
      padding: 10px 8px;
    }

    .store-filters {
      padding: 10px;
      gap: 8px;
    }

    .store-filter-selects {
      display: flex;
      flex-direction: row;
      gap: 8px;
      width: 100%;
    }

    .skin-catalog-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      width: 100% !important;
    }

    .skin-catalog-card {
      min-width: 0 !important;
      width: 100% !important;
      min-height: 110px !important;
      padding: 10px 6px !important;
    }

    .skin-card-img-wrap {
      height: 46px;
    }

    .skin-card-img {
      max-height: 40px;
    }

    .skin-card-name {
      font-size: 10.5px;
    }
  }
</style>
