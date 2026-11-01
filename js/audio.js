// NXTPAK Studio - Industrial Sound FX Engine (Web Audio API Synthesizer)
// Provides realistic pneumatic whooshes, drop impacts, laser scanning, and telemetry chimes

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Play subtle tactile UI click
  playClick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Pneumatic lift hiss when box rises for drop test
  playPneumaticLift() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Noise buffer for air pressure hiss
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.35);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.4);
  }

  // Whoosh sound during falling acceleration
  playWhoosh() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Realistic heavy packaging impact thud + cardboard crumple (Cinematic Multi-layer)
  playImpact(isCritical = false) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Ultra-Low Sub-bass seismic thud (Mass kinetic energy transfer)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isCritical ? 160 : 110, now);
    subOsc.frequency.exponentialRampToValueAtTime(26, now + 0.38);

    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.45);

    // 2. Mid-frequency cardboard body resonance (Hollow box acoustic cavity)
    const midOsc = this.ctx.createOscillator();
    const midGain = this.ctx.createGain();

    midOsc.type = 'triangle';
    midOsc.frequency.setValueAtTime(280, now);
    midOsc.frequency.exponentialRampToValueAtTime(70, now + 0.22);

    midGain.gain.setValueAtTime(0.35, now);
    midGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    midOsc.connect(midGain);
    midGain.connect(this.ctx.destination);
    midOsc.start(now);
    midOsc.stop(now + 0.26);

    // 3. Cardboard structure progressive crumple & paper fiber tearing noise
    const bufferSize = this.ctx.sampleRate * 0.28;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Crackling exponential noise envelope
      const crackle = Math.random() > 0.88 ? (Math.random() - 0.5) * 2.5 : (Math.random() - 0.5) * 0.8;
      data[i] = crackle * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isCritical ? 1900 : 900, now);
    filter.Q.value = 1.8;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isCritical ? 0.6 : 0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.28);

    // If critical stress detected, play structural failure sounds
    if (isCritical) {
      setTimeout(() => this.playStructuralSnap(), 30);
      setTimeout(() => this.playWarningBeep(), 200);
    } else {
      setTimeout(() => this.playSuccessPassChime(), 260);
    }
  }

  // Test passed chime (futuristic engineering confirmation)
  playSuccessPassChime() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  // Warning buzz when critical stress threshold is exceeded
  playWarningBeep() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(190, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Futuristic scanning laser sound for Generative AI computation
  playScanSweep() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.8);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  // Sharp structural snap / fracture sound (material breaking)
  playStructuralSnap() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Fast high-pitch transient click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    // Burst of white noise for splintering / tearing
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  // Realistic glass shatter / brittle fracture sound
  playGlassShatter() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const frequencies = [2400, 3100, 4200, 5600, 1800, 2900];

    frequencies.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = now + i * 0.015;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 400, delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, delay + 0.15);

      gain.gain.setValueAtTime(0.12, delay);
      gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(delay);
      osc.stop(delay + 0.2);
    });

    // Scattering debris clatter
    setTimeout(() => this.playDebrisClatter(), 120);
  }

  // Clattering debris pieces bouncing on the floor
  playDebrisClatter() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    for (let i = 0; i < 6; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = now + 0.05 + i * 0.04 + Math.random() * 0.03;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 800, delay);
      osc.frequency.exponentialRampToValueAtTime(200, delay + 0.03);

      gain.gain.setValueAtTime(0.04 / (i + 1), delay);
      gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(delay);
      osc.stop(delay + 0.035);
    }
  }
}

export const sound = new SoundEngine();
