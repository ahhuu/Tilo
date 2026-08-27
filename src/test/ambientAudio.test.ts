import { describe, it, expect, beforeEach } from 'vitest';
import { ambientAudioService } from '@/core/audio/ambientAudioService';

describe('Ambient Audio Synthesizer Service', () => {
  beforeEach(() => {
    ambientAudioService.stop();
  });

  it('initializes with default volume and muted status', () => {
    expect(ambientAudioService.getVolume()).toBeGreaterThanOrEqual(0);
    expect(ambientAudioService.getVolume()).toBeLessThanOrEqual(1);
    expect(ambientAudioService.getIsMuted()).toBe(false);
    expect(ambientAudioService.getCurrentSound()).toBe('none');
  });

  it('updates volume clamped between 0 and 1', () => {
    ambientAudioService.setVolume(0.8);
    expect(ambientAudioService.getVolume()).toBe(0.8);

    ambientAudioService.setVolume(1.5);
    expect(ambientAudioService.getVolume()).toBe(1);

    ambientAudioService.setVolume(-0.5);
    expect(ambientAudioService.getVolume()).toBe(0);
  });

  it('toggles mute state correctly', () => {
    const isMuted = ambientAudioService.toggleMute();
    expect(isMuted).toBe(true);
    expect(ambientAudioService.getIsMuted()).toBe(true);

    const isUnmuted = ambientAudioService.toggleMute();
    expect(isUnmuted).toBe(false);
    expect(ambientAudioService.getIsMuted()).toBe(false);
  });

  it('switches ambient sound modes without throwing in mock environment', () => {
    expect(() => ambientAudioService.playSound('rain')).not.toThrow();
    expect(() => ambientAudioService.playSound('waves')).not.toThrow();
    expect(() => ambientAudioService.playSound('white_noise')).not.toThrow();
    expect(() => ambientAudioService.playZenChime()).not.toThrow();
    expect(() => ambientAudioService.stop()).not.toThrow();
  });

  it('updates timer paused state properly', () => {
    expect(ambientAudioService.getIsTimerPaused()).toBe(false);
    ambientAudioService.setTimerPaused(true);
    expect(ambientAudioService.getIsTimerPaused()).toBe(true);
    ambientAudioService.setTimerPaused(false);
    expect(ambientAudioService.getIsTimerPaused()).toBe(false);
  });
});
