<script>
  import { onMount, onDestroy } from 'svelte';

  let isOnline = true;
  let showToast = false;
  let statusType = 'online'; // 'online' | 'offline'
  let hideTimer = null;

  function handleOnline() {
    isOnline = true;
    statusType = 'online';
    showToast = true;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      showToast = false;
    }, 3500);
  }

  function handleOffline() {
    isOnline = false;
    statusType = 'offline';
    showToast = true;
    clearTimeout(hideTimer);
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      isOnline = navigator.onLine;
      if (!isOnline) {
        handleOffline();
      }
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(hideTimer);
    }
  });
</script>

{#if showToast}
  <div 
    class="net-toast net-toast-{statusType}" 
    role="status" 
    aria-live="polite"
  >
    <div class="net-pulse-wrap">
      <span class="net-pulse-dot"></span>
      <span class="net-pulse-ring"></span>
    </div>
    
    <div class="net-content">
      <span class="net-title">
        {#if statusType === 'offline'}
          ⚡ UPLINK LOST
        {:else}
          📡 UPLINK RESTORED
        {/if}
      </span>
      <span class="net-divider">//</span>
      <span class="net-subtitle">
        {#if statusType === 'offline'}
          OFFLINE MODE ACTIVE — SERVING CACHED INTEL
        {:else}
          RECONNECTED TO LIVE DATA FEED
        {/if}
      </span>
    </div>
  </div>
{/if}

<style>
  .net-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 20px;
    background: rgba(10, 10, 14, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 30px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.06);
    pointer-events: auto;
    user-select: none;
    animation: slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .net-toast-offline {
    border: 1px solid rgba(250, 68, 84, 0.4);
    box-shadow: 0 12px 36px rgba(250, 68, 84, 0.25), inset 0 0 0 1px rgba(250, 68, 84, 0.15);
  }

  .net-toast-online {
    border: 1px solid rgba(62, 207, 142, 0.4);
    box-shadow: 0 12px 36px rgba(62, 207, 142, 0.25), inset 0 0 0 1px rgba(62, 207, 142, 0.15);
  }

  .net-pulse-wrap {
    position: relative;
    width: 10px;
    height: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .net-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    z-index: 2;
  }

  .net-toast-offline .net-pulse-dot {
    background: #fa4454;
    box-shadow: 0 0 10px #fa4454;
  }

  .net-toast-online .net-pulse-dot {
    background: #3ecf8e;
    box-shadow: 0 0 10px #3ecf8e;
  }

  .net-pulse-ring {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    opacity: 0.75;
    animation: radarPulse 1.8s infinite ease-out;
  }

  .net-toast-offline .net-pulse-ring {
    border: 1.5px solid #fa4454;
  }

  .net-toast-online .net-pulse-ring {
    border: 1.5px solid #3ecf8e;
  }

  .net-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    line-height: 1;
    white-space: nowrap;
  }

  .net-title {
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .net-toast-offline .net-title {
    color: #fa4454;
    text-shadow: 0 0 10px rgba(250, 68, 84, 0.4);
  }

  .net-toast-online .net-title {
    color: #3ecf8e;
    text-shadow: 0 0 10px rgba(62, 207, 142, 0.4);
  }

  .net-divider {
    color: rgba(255, 255, 255, 0.25);
    font-size: 10px;
  }

  .net-subtitle {
    color: rgba(255, 255, 255, 0.85);
    font-size: 10.5px;
    letter-spacing: 0.5px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 600;
    text-transform: uppercase;
  }

  @keyframes slideDownFade {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }
  }

  @keyframes radarPulse {
    0% {
      transform: scale(0.6);
      opacity: 0.9;
    }
    100% {
      transform: scale(1.8);
      opacity: 0;
    }
  }

  @media (max-width: 600px) {
    .net-toast {
      top: 12px;
      padding: 8px 14px;
      max-width: 92vw;
    }
    .net-content {
      font-size: 9.5px;
      gap: 5px;
    }
    .net-subtitle {
      font-size: 9.5px;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }
  }
</style>
