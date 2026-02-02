import { Injectable } from '@angular/core';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

/**
 * Service for handling text-to-speech operations
 * Abstracts browser Speech Synthesis API for better testability
 */
@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private readonly DEFAULT_RATE = 0.85;
  private readonly DEFAULT_PITCH = 1.05;
  private readonly DEFAULT_VOLUME = 1;

  private voicesLoaded = false;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.initializeVoices();
  }

  /**
   * Initialize voices and handle voice loading
   */
  private initializeVoices(): void {
    if (!this.isSpeechSupported()) {
      return;
    }

    // Load voices immediately if available
    this.availableVoices = window.speechSynthesis.getVoices();
    this.voicesLoaded = this.availableVoices.length > 0;

    // Listen for voices changed event (Chrome loads voices asynchronously)
    window.speechSynthesis.onvoiceschanged = () => {
      this.availableVoices = window.speechSynthesis.getVoices();
      this.voicesLoaded = true;
    };
  }

  /**
   * Speak the given text
   * @param text The text to speak
   * @param options Optional speech parameters
   * @returns Promise that resolves when speech starts, rejects on error
   */
  async speak(text: string, options?: SpeechOptions): Promise<void> {
    if (!this.isSpeechSupported()) {
      throw new Error('Speech synthesis is not supported in this browser');
    }

    // Cancel any ongoing speech
    this.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice
      const voice = this.selectBestVoice(options?.lang);
      if (voice) {
        utterance.voice = voice;
      }

      // Set speech parameters
      utterance.rate = options?.rate ?? this.DEFAULT_RATE;
      utterance.pitch = options?.pitch ?? this.DEFAULT_PITCH;
      utterance.volume = options?.volume ?? this.DEFAULT_VOLUME;

      // Add natural pauses
      utterance.text = this.addNaturalPauses(text);

      // Handle events
      utterance.onstart = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      // Speak
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Cancel any ongoing speech
   */
  cancel(): void {
    if (this.isSpeechSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Pause ongoing speech
   */
  pause(): void {
    if (this.isSpeechSupported()) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.isSpeechSupported()) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Check if speech synthesis is currently speaking
   */
  isSpeaking(): boolean {
    return this.isSpeechSupported() && window.speechSynthesis.speaking;
  }

  /**
   * Check if speech synthesis is paused
   */
  isPaused(): boolean {
    return this.isSpeechSupported() && window.speechSynthesis.paused;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  /**
   * Check if voices are loaded
   */
  areVoicesLoaded(): boolean {
    return this.voicesLoaded;
  }

  /**
   * Check if speech synthesis is supported
   */
  isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Select the best voice for the given language
   * Prefers high-quality voices (Google, Premium, Enhanced, Natural)
   */
  private selectBestVoice(lang?: string): SpeechSynthesisVoice | null {
    if (this.availableVoices.length === 0) {
      return null;
    }

    const targetLang = lang || 'en';

    // Try to find high-quality voice
    const preferredVoice = this.availableVoices.find(voice =>
      voice.lang.startsWith(targetLang) && (
        voice.name.includes('Google') ||
        voice.name.includes('Premium') ||
        voice.name.includes('Enhanced') ||
        voice.name.includes('Natural') ||
        voice.localService === false
      )
    );

    if (preferredVoice) {
      return preferredVoice;
    }

    // Fallback to any voice matching the language
    return this.availableVoices.find(voice => voice.lang.startsWith(targetLang)) || null;
  }

  /**
   * Add natural pauses to text for better speech quality
   */
  private addNaturalPauses(text: string): string {
    return text.replace(/([.!?])\s+/g, '$1 ... ');
  }
}
