// ValTracker — Cyberpunk Audio Engine for Valorant Wrapped Stories

class WrappedAudioEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private timer: any = null;

  public init() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
    } catch (e) {
      console.warn('[WrappedAudio] Web Audio API not supported');
    }
  }

  public playBeat() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;

    // Synthesize a soft synthwave beat loop (bassline + synth arpeggio)
    let step = 0;
    const notes = [130.81, 146.83, 164.81, 196.00, 130.81, 164.81, 146.83, 110.00]; // C3, D3, E3, G3...

    this.timer = setInterval(() => {
      if (!this.isPlaying || this.isMuted || !this.audioCtx) return;
      try {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Synth sound
        osc.type = step % 4 === 0 ? 'sawtooth' : 'sine';
        const freq = notes[step % notes.length];
        osc.frequency.setValueAtTime(freq, now);

        // Envelope
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.25);

        step++;
      } catch (e) {}
    }, 280); // ~107 BPM beat
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    } else {
      this.playBeat();
    }
    return this.isMuted;
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }
}

export const wrappedAudio = new WrappedAudioEngine();
