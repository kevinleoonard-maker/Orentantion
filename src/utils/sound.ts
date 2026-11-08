/**
 * Web Audio API procedural sound synthesizer for interactive feedback
 */

class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBlip(freq: number = 440, type: OscillatorType = 'sine', duration: number = 0.06) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio not supported or blocked
    }
  }

  playEat() {
    if (!this.enabled) return;
    this.playBlip(587, 'triangle', 0.08);
    setTimeout(() => this.playBlip(880, 'triangle', 0.12), 40);
  }

  playCrash() {
    if (!this.enabled) return;
    this.playBlip(140, 'sawtooth', 0.2);
  }

  playFlipBit(bitVal: boolean) {
    if (!this.enabled) return;
    this.playBlip(bitVal ? 660 : 330, 'sine', 0.05);
  }

  playSuccess() {
    if (!this.enabled) return;
    this.playBlip(523, 'sine', 0.08);
    setTimeout(() => this.playBlip(659, 'sine', 0.08), 80);
    setTimeout(() => this.playBlip(784, 'sine', 0.15), 160);
  }
}

export const sound = new SoundFX();
