<script>
  import { fade, fly } from 'svelte/transition';
  import { submitFeedback } from '../../lib/api';

  export let open = false;
  export let onClose = () => {};

  let feedback = '';
  let contact = '';
  let loading = false;
  let successMsg = '';
  let errorMsg = '';

  $: if (open) {
    feedback = '';
    contact = '';
    successMsg = '';
    errorMsg = '';
  }

  async function handleSubmit() {
    const cleanFeedback = feedback.trim();
    if (!cleanFeedback) {
      errorMsg = 'Please enter some feedback content before transmitting.';
      return;
    }

    loading = true;
    errorMsg = '';
    successMsg = '';

    try {
      const res = await submitFeedback(cleanFeedback, contact.trim());
      if (res.status === 'ok' || res.message) {
        successMsg = res.message || 'Feedback submitted successfully! Thank you.';
        feedback = '';
        contact = '';
      } else {
        throw new Error(res.message || 'Feedback submission failed');
      }
    } catch (e) {
      errorMsg = e.message || 'An error occurred while transmitting feedback.';
    } finally {
      loading = false;
    }
  }
</script>

{#if open}
  <div class="modal-overlay" on:click={onClose} transition:fade={{ duration: 200 }}>
    <div
      class="modal-card"
      on:click|stopPropagation
      transition:fly={{ y: 20, duration: 350 }}
    >
      <div class="modal-header">
        <h3 class="modal-title">
          <span>⚡</span> Feedback / Bug Report
        </h3>
        <button class="modal-close-btn" on:click={onClose}>✕</button>
      </div>

      <div class="modal-body">
        {#if successMsg}
          <div class="success-state">
            <span class="success-icon">✓</span>
            <p class="success-text">{successMsg}</p>
            <button class="done-btn" on:click={onClose}>Close Window</button>
          </div>
        {:else}
          <div class="form-group">
            <label for="feedback-msg">Message // Report Content</label>
            <textarea
              id="feedback-msg"
              bind:value={feedback}
              placeholder="Found a bug? Have an idea? Tell us here..."
              disabled={loading}
              class="feedback-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="feedback-contact">Contact Info // Discord or Email (Optional)</label>
            <input
              id="feedback-contact"
              type="text"
              bind:value={contact}
              placeholder="RiotID#TAG, Discord tag, or email"
              disabled={loading}
              class="feedback-input"
            />
          </div>

          {#if errorMsg}
            <div class="error-msg">⚠️ {errorMsg}</div>
          {/if}

          <button class="submit-btn" on:click={handleSubmit} disabled={loading}>
            {loading ? 'TRANSMITTING...' : 'TRANSMIT REPORT'}
          </button>
        {/if}
      </div>

      <div class="modal-footer">
        Submitted reports are reviewed directly by the developer to improve ValTracker.
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 12, 0.85);
    backdrop-filter: blur(15px);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-card {
    background: linear-gradient(135deg, #121216 0%, #08080a 100%);
    border: 1px solid rgba(250, 68, 84, 0.35);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    border-radius: 16px;
    width: 420px;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(250, 68, 84, 0.15);
  }

  .modal-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 22px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    text-shadow: 0 0 10px rgba(250, 68, 84, 0.3);
  }

  .modal-close-btn {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 18px;
    cursor: pointer;
    transition: color 0.15s;
    padding: 4px;
  }

  .modal-close-btn:hover {
    color: var(--accent);
  }

  .modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .feedback-textarea, .feedback-input {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 12px;
    color: #fff;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }

  .feedback-textarea {
    height: 120px;
    resize: none;
    font-family: inherit;
    line-height: 1.5;
  }

  .feedback-textarea:focus, .feedback-input:focus {
    border-color: var(--accent);
  }

  .error-msg {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--loss);
  }

  .submit-btn {
    background: var(--accent);
    color: #0d0d0f;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 15px;
    letter-spacing: 1px;
    border: none;
    padding: 12px 0;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(250, 68, 84, 0.2);
    transition: all 0.25s;
    text-transform: uppercase;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(250, 68, 84, 0.35);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    gap: 12px;
    text-align: center;
  }

  .success-icon {
    font-size: 40px;
    color: var(--win);
    background: rgba(16, 185, 129, 0.1);
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .success-text {
    font-size: 14px;
    color: #fff;
    margin: 0;
  }

  .done-btn {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 8px;
    padding: 10px 24px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .done-btn:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  .modal-footer {
    padding: 14px 24px;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid var(--border);
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    text-align: center;
  }
</style>
