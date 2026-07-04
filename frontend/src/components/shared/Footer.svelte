<footer class="global-footer">
  <div class="footer-disclaimer">
    VALTRACKER IS NOT ENDORSED BY RIOT GAMES AND DOES NOT REFLECT THE VIEWS OR OPINIONS OF RIOT GAMES OR ANYONE OFFICIALLY INVOLVED IN PRODUCING OR MANAGING VALORANT. VALORANT AND RIOT GAMES ARE TRADEMARKS OR REGISTERED TRADEMARKS OF RIOT GAMES, INC. VALORANT © RIOT GAMES, INC.
  </div>
  <div class="footer-socials">
    <span class="footer-developer">Developed by Pratham</span>
    <div class="footer-links">
      <a href="https://github.com/itzpratham1" target="_blank" title="GitHub" class="footer-link">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      </a>
      <a href="https://x.com/itzpratham01" target="_blank" title="Twitter / X" class="footer-link">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
    </div>
  </div>
</footer>

<style>
  .global-footer {
    width: calc(100% - 56px);
    max-width: 1200px;
    margin: 40px auto 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    box-sizing: border-box;
  }
  .footer-disclaimer {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: var(--muted2);
    text-align: center;
    max-width: 760px;
    line-height: 1.6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .footer-socials {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 8px;
  }
  .footer-developer {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 800;
    color: var(--muted);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .footer-links {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .footer-link {
    color: var(--muted);
    display: inline-block;
    transition: color 0.2s;
  }
  .footer-link:hover {
    color: var(--accent);
  }
</style>
