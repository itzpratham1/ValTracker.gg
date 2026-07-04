<script>
  import { onMount } from 'svelte';

  let message = '';
  let visible = false;
  let timeout;

  export function show(msg) {
    message = msg;
    visible = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => { visible = false; }, 2500);
  }

  onMount(() => {
    window.showToast = show;
    return () => { clearTimeout(timeout); };
  });
</script>

<div class="toast" class:show={visible}>{message}</div>

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
  }
  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }
</style>
