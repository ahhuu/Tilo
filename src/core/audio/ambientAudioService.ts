/**
 * Procedural Web Audio Ambient Sound Synthesizer
 * Generates ambient sounds (Rain, Waves, White Noise, Zen Bell) mathematically
 * using the Web Audio API without downloading external audio assets.
 */

export type AmbientSoundType = 'none' | 'rain' | 'waves' | 'white_noise';

class AmbientAudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: AmbientSoundType = 'none';
  private volume: number = 0.5; // 0.0 to 1.0
  private isMuted: boolean = false;
  private isTimerPaused: boolean = false;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      const targetGain = (this.isMuted || this.isTimerPaused) ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted && !this.isTimerPaused) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setTimerPaused(paused: boolean): void {
    this.isTimerPaused = paused;
    if (this.masterGain && this.ctx) {
      const targetGain = (this.isMuted || this.isTimerPaused) ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }
  }

  public getIsTimerPaused(): boolean {
    return this.isTimerPaused;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = (this.isMuted || this.isTimerPaused) ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getCurrentSound(): AmbientSoundType {
    return this.currentType;
  }

  public stop(): void {
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeNodes = [];
    this.currentType = 'none';
  }

  /**
   * Generates continuous Pink/Brown noise buffer
   */
  private createNoiseBuffer(durationSeconds = 5, color: 'white' | 'pink' | 'brown' = 'pink'): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * durationSeconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (color === 'white') {
        output[i] = white * 0.15;
      } else if (color === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      } else {
        // Brown noise
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.3;
      }
    }
    return buffer;
  }

  public playSound(type: AmbientSoundType): void {
    this.stop();
    if (type === 'none') return;

    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    this.currentType = type;

    if (type === 'white_noise') {
      const buffer = this.createNoiseBuffer(5, 'pink');
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      source.connect(filter);
      filter.connect(this.masterGain);
      source.start();

      this.activeNodes.push(source, filter);
    } else if (type === 'rain') {
      // Pink noise through multi-stage filter for gentle spring rain
      const buffer = this.createNoiseBuffer(5, 'pink');
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.setValueAtTime(3000, ctx.currentTime);
      highShelf.gain.setValueAtTime(-6, ctx.currentTime);

      source.connect(filter);
      filter.connect(highShelf);
      highShelf.connect(this.masterGain);
      source.start();

      this.activeNodes.push(source, filter, highShelf);
    } else if (type === 'waves') {
      // Brown noise modulated with an LFO for rhythmic ocean tide
      const buffer = this.createNoiseBuffer(6, 'brown');
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const waveFilter = ctx.createBiquadFilter();
      waveFilter.type = 'lowpass';
      waveFilter.frequency.setValueAtTime(400, ctx.currentTime);

      const waveGain = ctx.createGain();
      waveGain.gain.setValueAtTime(0.3, ctx.currentTime);

      // Low frequency oscillator (LFO) for wave swelling every ~6 seconds
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.16, ctx.currentTime); // ~6.25s per wave cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.25, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(waveGain.gain);

      source.connect(waveFilter);
      waveFilter.connect(waveGain);
      waveGain.connect(this.masterGain);

      lfo.start();
      source.start();

      this.activeNodes.push(source, lfo, waveFilter, waveGain, lfoGain);
    }
  }

  /**
   * Plays a crisp, gentle singing bowl / Zen Bell chime for session or pomodoro transitions.
   */
  public playZenChime(): void {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chimeGain = ctx.createGain();
    chimeGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.6, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
    chimeGain.connect(ctx.destination);

    // Fundamental tone (528Hz - Solfeggio Love frequency)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(528, now);

    // Harmonic overtone (1056Hz)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1056, now);

    // Subtle third harmonic
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1584, now);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.3, now);

    osc1.connect(chimeGain);
    osc2.connect(harmonicGain);
    osc3.connect(harmonicGain);
    harmonicGain.connect(chimeGain);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 3.2);
    osc2.stop(now + 3.2);
    osc3.stop(now + 3.2);
  }
}

export const ambientAudioService = new AmbientAudioService();
