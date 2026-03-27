/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playPerfect() {
    this.playTone(880, 'sine', 0.3, 0.1);
    setTimeout(() => this.playTone(1100, 'sine', 0.3, 0.1), 50);
  }

  playMiss() {
    this.playTone(150, 'sawtooth', 0.4, 0.1);
  }

  playLate() {
    this.playTone(300, 'triangle', 0.3, 0.1);
  }

  playCallout() {
    this.playTone(660, 'sine', 0.1, 0.05);
  }

  playClick() {
    this.playTone(440, 'sine', 0.05, 0.05);
  }
}

export const audio = new AudioEngine();
