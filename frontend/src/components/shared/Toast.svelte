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
    bottom: 28px;
    left: 50%;
    right: auto;
    transform: translate3d(-50%, 20px, 0);
    background: rgba(14, 14, 18, 0.94);
    border: 1px solid rgba(250, 68, 84, 0.35);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    color: #fff;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.5px;
    padding: 10px 20px;
    border-radius: 30px;
    z-index: 999999;
    opacity: 0;
    pointer-events: none;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.7), 0 0 18px rgba(250, 68, 84, 0.2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
    white-space: nowrap;
    text-align: center;
  }
  .toast.show {
    opacity: 1;
    transform: translate3d(-50%, 0, 0);
    pointer-events: auto;
  }

  @media (max-width: 600px) {
    .toast {
      bottom: 20px;
      font-size: 11px;
      padding: 9px 16px;
      max-width: calc(100vw - 24px);
    }
  }
</style>
