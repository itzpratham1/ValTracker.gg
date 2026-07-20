<script>
  import { onMount } from 'svelte';

  let message = '';
  let visible = false;
  let type = 'default'; // 'default' | 'copy' | 'success' | 'error'
  let timeout;

  const ICONS = {
    copy:    '📋',
    success: '✓',
    error:   '✕',
    default: ''
  };

  export function show(msg, toastType = 'default') {
    message = msg;
    type = toastType;
    visible = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => { visible = false; }, 2500);
  }

  onMount(() => {
    window.showToast = (msg, t) => show(msg, t);
    return () => { clearTimeout(timeout); };
  });
</script>

<div class="toast toast-{type}" class:show={visible}>
  {#if ICONS[type]}
    <span class="toast-icon">{ICONS[type]}</span>
  {/if}
  {message}
</div>

<style>
  .toast {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: rgba(20, 20, 24, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    color: #fff;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.5px;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: 320px;
    white-space: nowrap;
  }
  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }
</style>
