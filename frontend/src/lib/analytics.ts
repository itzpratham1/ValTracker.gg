const API_BASE = import.meta.env.PUBLIC_API_URL || '';

export interface EventPayload {
  [key: string]: any;
}

export function trackEvent(eventName: string, payload: EventPayload = {}): void {
  if (typeof window === 'undefined') return;

  const timestamp = new Date().toISOString();
  const eventData = { ...payload, timestamp };

  // 1. Google Analytics (gtag)
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', eventName, eventData);
  }

  // 2. Plausible Analytics
  if (typeof (window as any).plausible === 'function') {
    (window as any).plausible(eventName, { props: eventData });
  }

  // 3. PostHog Analytics
  if (typeof (window as any).posthog?.capture === 'function') {
    (window as any).posthog.capture(eventName, eventData);
  }

  // 4. Dispatch to custom window event listener for browser extensions / dev tools
  try {
    const customEvent = new CustomEvent('valtracker:telemetry', {
      detail: { eventName, payload: eventData }
    });
    window.dispatchEvent(customEvent);
  } catch {
    // Ignore unsupported environments
  }

  // 5. Send non-blocking beacon to self-hosted /api/events endpoint
  try {
    const telemetryUrl = `${API_BASE}/api/events`;
    const bodyStr = JSON.stringify({ event: eventName, payload: eventData });
    if (navigator.sendBeacon) {
      const blob = new Blob([bodyStr], { type: 'application/json' });
      navigator.sendBeacon(telemetryUrl, blob);
    } else {
      fetch(telemetryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // Fail silently so user interactions are never blocked
  }

  // Dev logging
  if (import.meta.env.DEV) {
    console.log(`[VALTRACKER TELEMETRY] ${eventName}`, eventData);
  }
}

export function trackPageView(pageName: string): void {
  trackEvent('page_view', { page: pageName, path: typeof window !== 'undefined' ? window.location.pathname : '' });
}
