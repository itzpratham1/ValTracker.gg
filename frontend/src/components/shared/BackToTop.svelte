<script>
  import { onMount, onDestroy } from 'svelte';

  let visible = false;

  function handleScroll() {
    visible = typeof window !== 'undefined' && window.scrollY > 300;
  }

  function scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onMount(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', handleScroll);
    }
  });
</script>

<button
  id="back-to-top"
  class="back-to-top-btn"
  class:visible
  on:click={scrollToTop}
  title="Back to Top"
  aria-label="Back to Top"
>
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
</button>

<style>
  .back-to-top-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: rgba(18, 18, 24, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    color: var(--accent, #fa4454);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px) scale(0.9);
    transition: opacity 0.25s ease, transform 0.25s ease, border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .back-to-top-btn.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
  }

  .back-to-top-btn:hover {
    background: var(--surface2, #181820);
    border-color: var(--accent, #fa4454);
    color: #ffffff;
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 32px rgba(250, 68, 84, 0.35), inset 0 0 0 1px rgba(250, 68, 84, 0.2);
  }

  .back-to-top-btn:active {
    transform: translateY(-1px) scale(0.98);
  }

  @media (max-width: 800px) {
    .back-to-top-btn {
      bottom: 16px;
      right: 16px;
      width: 38px;
      height: 38px;
    }
  }
</style>
