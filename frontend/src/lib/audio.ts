let audioCtx: AudioContext | null = null;
let isMuted = false;

if (typeof window !== 'undefined') {
  isMuted = localStorage.getItem('valtracker_muted') === 'true';
}

export function getAudioContext(): AudioContext | null {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function setMuted(muted: boolean): void {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('valtracker_muted', String(muted));
  }
}

export function getMuted(): boolean {
  return isMuted;
}

export function triggerHaptic(pattern: number | number[] = 10): void {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore permission or window focus errors
    }
  }
}

export function playSound(type: 'hover' | 'click' | 'submit' | 'error' | 'success' | 'lock_in' | 'tab_switch' | 'cancel' | 'split_snap'): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'hover') {
    // Ultra short high pitch cyber blip
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.04);
    osc.start(now);
    osc.stop(now + 0.04);
    triggerHaptic(4);
  } else if (type === 'click') {
    // Crisp high double blip
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(1800, now + 0.025);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.06);
    triggerHaptic(8);
  } else if (type === 'tab_switch') {
    // Tactical segment pill click
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
    triggerHaptic(10);
  } else if (type === 'submit' || type === 'lock_in') {
    // Deep Valorant Lock-In sub bass + riser
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(700, now);
    osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
    gain2.gain.setValueAtTime(0.03, now);
    gain2.gain.linearRampToValueAtTime(0.0001, now + 0.15);
    osc2.start(now);
    osc2.stop(now + 0.15);

    triggerHaptic([20, 30, 40]);
  } else if (type === 'split_snap') {
    // Crisp double snap on auto-split
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.03);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.04);
    osc.start(now);
    osc.stop(now + 0.04);
    triggerHaptic([12, 12]);
  } else if (type === 'cancel') {
    // Downward cyber chirp
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.15);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
    triggerHaptic(15);
  } else if (type === 'success') {
    // Happy tactical chime
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.setValueAtTime(1800, now + 0.06);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.18);
    triggerHaptic([15, 15]);
  } else if (type === 'error') {
    // Low double warning buzz
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.22);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.22);
    triggerHaptic([30, 40, 30]);
  }
}

