<script>
  import { AGENT_UUIDS, AGENT_ROLES } from '../../lib/constants';
  import { getAgentIconUrl, getRoleClass, normalizeAgentKey } from '../../lib/draft-engine';

  export let open = false;
  export let currentSlots = [];
  export let onSelect = () => {};
  export let onClose = () => {};

  const ROLES = {
    duelist: { title: 'Duelists', color: '#ff5757', desc: 'Self-sufficient fraggers and space-creators', agents: [] },
    initiator: { title: 'Initiators', color: '#ffd700', desc: 'Information gatherers and flash/stun utilities', agents: [] },
    controller: { title: 'Controllers', color: '#00d4e0', desc: 'Smoke and territorial blocking experts', agents: [] },
    sentinel: { title: 'Sentinels', color: '#3ecf8e', desc: 'Defensive area lockdown and flank watch anchors', agents: [] }
  };

  function getAvailableAgents() {
    const roles = JSON.parse(JSON.stringify(ROLES));
    const seenUuids = new Set();
    const allAgents = Object.keys(AGENT_UUIDS).filter(ag => {
      const uuid = AGENT_UUIDS[ag];
      if (seenUuids.has(uuid)) return false;
      seenUuids.add(uuid);
      return true;
    });

    allAgents.forEach(ag => {
      const agKey = normalizeAgentKey(ag.toLowerCase());
      const alreadySelected = currentSlots.some(s => {
        if (!s) return false;
        return normalizeAgentKey(s.toLowerCase()) === agKey;
      });
      if (!alreadySelected) {
        const role = getRoleClass(ag);
        if (roles[role]) {
          roles[role].agents.push(ag);
        }
      }
    });

    return roles;
  }

  function handleSelect(agentKey) {
    onSelect(normalizeAgentKey(agentKey.toLowerCase()));
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && open) onClose();
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  $: roles = open ? getAvailableAgents() : null;
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div class="stat-modal-overlay open" on:click={handleOverlayClick}>
    <div class="stat-modal agent-selector-modal">
      <div class="stat-modal-header agent-selector-header">
        <div class="stat-modal-title agent-selector-title">Select Draft Agent</div>
        <button class="stat-modal-close" on:click={onClose}>&#10005;</button>
      </div>
      <div class="stat-modal-body agent-selector-body">
        {#if roles}
          <div class="agent-selector-list">
            {#each Object.entries(roles) as [roleKey, roleInfo]}
              {#if roleInfo.agents.length > 0}
                <div class="agent-role-section">
                  <div class="agent-role-header">
                    <div class="agent-role-name" style="color: {roleInfo.color};">
                      {#if roleKey === 'duelist'}&#9876;&#65039;
                      {:else if roleKey === 'initiator'}&#127919;
                      {:else if roleKey === 'controller'}&#127744;
                      {:else if roleKey === 'sentinel'}&#128737;&#65039;
                      {/if}
                      {roleInfo.title}
                    </div>
                    <div class="agent-role-desc">{roleInfo.desc}</div>
                  </div>
                  <div class="agent-role-grid">
                    {#each roleInfo.agents as agent}
                      {@const iconUrl = getAgentIconUrl(agent)}
                      <div class="agent-pick-card" on:click={() => handleSelect(agent)}>
                        {#if iconUrl}
                          <img class="agent-pick-icon" src={iconUrl} alt={agent} />
                        {:else}
                          <div class="agent-pick-fallback">{agent.substring(0, 1)}</div>
                        {/if}
                        <div class="agent-pick-name">{agent}</div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .agent-selector-modal {
    max-width: 580px;
    border-color: rgba(255,255,255,0.08);
    background: #0c0c0f;
    border-radius: 16px;
  }

  .agent-selector-header {
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 12px;
  }

  .agent-selector-title {
    font-size: 18px;
    font-family: 'Barlow Condensed', sans-serif;
    text-transform: uppercase;
  }

  .agent-selector-body {
    padding: 16px 0;
    max-height: 400px;
    overflow-y: auto;
  }

  .agent-selector-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .agent-role-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .agent-role-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .agent-role-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .agent-role-desc {
    font-size: 10px;
    color: var(--muted);
    font-style: italic;
  }

  .agent-role-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: 12px;
  }

  .agent-pick-card {
    padding: 10px 6px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.01);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .agent-pick-card:hover {
    border-color: var(--accent);
    background: rgba(255, 255, 255, 0.03);
    transform: translateY(-2px);
    box-shadow: 0 0 12px rgba(250, 68, 84, 0.2);
  }

  .agent-pick-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
  }

  .agent-pick-fallback {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: var(--muted);
  }

  .agent-pick-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    font-weight: 800;
    color: #fff;
    text-transform: uppercase;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }
</style>
