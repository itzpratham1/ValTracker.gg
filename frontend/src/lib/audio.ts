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

export function playSound(type: 'hover' | 'click' | 'submit' | 'error' | 'success'): void {
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
  } else if (type === 'click') {
    // Crisp high double blip
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(1800, now + 0.025);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.06);
    osc.start(now);
    osc.stop(now + 0.06);
  } else if (type === 'submit') {
    // Quick high frequency riser
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.12);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  } else if (type === 'success') {
    // Happy tactical chime
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.setValueAtTime(1800, now + 0.06);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.18);
  } else if (type === 'error') {
    // Low double warning buzz
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.22);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.22);
  }
}
