import { TestBed } from '@angular/core/testing';
import { SpeechService } from './speech.service';

describe('SpeechService', () => {
  let service: SpeechService;
  let mockSpeechSynthesis: jasmine.SpyObj<SpeechSynthesis>;
  let mockVoices: SpeechSynthesisVoice[];
  let originalSpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;

  beforeEach(() => {
    // Save original SpeechSynthesisUtterance
    originalSpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

    // Create mock voices
    mockVoices = [
      createMockVoice('English US', 'en-US', true, 'Basic Voice'),
      createMockVoice('Google US English', 'en-US', false, 'Google US English'),
      createMockVoice('Premium UK Voice', 'en-GB', false, 'Premium UK Voice'),
    ];

    // Create mock SpeechSynthesis
    mockSpeechSynthesis = jasmine.createSpyObj('SpeechSynthesis', [
      'speak',
      'cancel',
      'pause',
      'resume',
      'getVoices'
    ]);

    Object.defineProperty(mockSpeechSynthesis, 'speaking', { value: false, writable: true });
    Object.defineProperty(mockSpeechSynthesis, 'paused', { value: false, writable: true });
    Object.defineProperty(mockSpeechSynthesis, 'pending', { value: false, writable: true });
    mockSpeechSynthesis.getVoices.and.returnValue(mockVoices);

    // Mock window.speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true,
      configurable: true
    });

    // Mock SpeechSynthesisUtterance constructor to allow mock voices
    (window as any).SpeechSynthesisUtterance = class MockUtterance {
      text: string;
      voice: SpeechSynthesisVoice | null = null;
      rate = 1;
      pitch = 1;
      volume = 1;
      onstart: ((ev: Event) => void) | null = null;
      onerror: ((ev: SpeechSynthesisErrorEvent) => void) | null = null;
      onend: ((ev: Event) => void) | null = null;

      constructor(text?: string) {
        this.text = text || '';
      }
    };

    TestBed.configureTestingModule({
      providers: [SpeechService]
    });
    service = TestBed.inject(SpeechService);
  });

  afterEach(() => {
    // Restore original SpeechSynthesisUtterance
    (window as any).SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
  });

  function createMockVoice(
    name: string,
    lang: string,
    localService: boolean,
    voiceURI: string
  ): SpeechSynthesisVoice {
    return {
      name,
      lang,
      localService,
      voiceURI,
      default: false
    } as SpeechSynthesisVoice;
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('speak', () => {
    it('should speak text with default options', async () => {
      const testText = 'Hello world';
      let capturedUtterance: SpeechSynthesisUtterance | null = null;

      mockSpeechSynthesis.speak.and.callFake((utterance: SpeechSynthesisUtterance) => {
        capturedUtterance = utterance;
        // Simulate speech starting
        setTimeout(() => utterance.onstart?.(new Event('start') as any), 0);
      });

      const speakPromise = service.speak(testText);
      await expectAsync(speakPromise).toBeResolved();

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(capturedUtterance).not.toBeNull();
    });

    it('should speak with custom options', async () => {
      const testText = 'Custom speech';
      const options = {
        rate: 1.5,
        pitch: 1.2,
        volume: 0.8,
        lang: 'en-US'
      };

      let capturedUtterance: SpeechSynthesisUtterance | null = null;

      mockSpeechSynthesis.speak.and.callFake((utterance: SpeechSynthesisUtterance) => {
        capturedUtterance = utterance;
        setTimeout(() => utterance.onstart?.(new Event('start') as any), 0);
      });

      await service.speak(testText, options);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(capturedUtterance).not.toBeNull();
    });

    it('should cancel ongoing speech before speaking', async () => {
      const testText = 'Test';

      mockSpeechSynthesis.speak.and.callFake((utterance: SpeechSynthesisUtterance) => {
        setTimeout(() => utterance.onstart?.(new Event('start') as any), 0);
      });

      await service.speak(testText);

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should reject when speech synthesis is not supported', async () => {
      // Remove speechSynthesis
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const newService = new SpeechService();

      await expectAsync(newService.speak('test')).toBeRejectedWithError(
        'Speech synthesis is not supported in this browser'
      );
    });

    it('should reject on speech error', async () => {
      const testText = 'Error test';

      mockSpeechSynthesis.speak.and.callFake((utterance: SpeechSynthesisUtterance) => {
        setTimeout(() => {
          const errorEvent = new Event('error') as any;
          errorEvent.error = 'synthesis-failed';
          utterance.onerror?.(errorEvent);
        }, 0);
      });

      await expectAsync(service.speak(testText)).toBeRejectedWithError(
        /Speech synthesis error/
      );
    });

    it('should add natural pauses to text', async () => {
      const testText = 'Hello. How are you? Great!';
      let capturedText = '';

      mockSpeechSynthesis.speak.and.callFake((utterance: SpeechSynthesisUtterance) => {
        capturedText = utterance.text;
        setTimeout(() => utterance.onstart?.(new Event('start') as any), 0);
      });

      await service.speak(testText);

      expect(capturedText).toContain('...');
    });
  });

  describe('cancel', () => {
    it('should cancel speech', () => {
      service.cancel();

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should not throw when speech synthesis is not supported', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const newService = new SpeechService();

      expect(() => newService.cancel()).not.toThrow();
    });
  });

  describe('pause', () => {
    it('should pause speech', () => {
      service.pause();

      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    });
  });

  describe('resume', () => {
    it('should resume speech', () => {
      service.resume();

      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });
  });

  describe('isSpeaking', () => {
    it('should return true when speaking', () => {
      Object.defineProperty(mockSpeechSynthesis, 'speaking', { value: true, writable: true });

      const result = service.isSpeaking();

      expect(result).toBe(true);
    });

    it('should return false when not speaking', () => {
      Object.defineProperty(mockSpeechSynthesis, 'speaking', { value: false, writable: true });

      const result = service.isSpeaking();

      expect(result).toBe(false);
    });

    it('should return false when speech synthesis is not supported', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const newService = new SpeechService();
      const result = newService.isSpeaking();

      expect(result).toBe(false);
    });
  });

  describe('isPaused', () => {
    it('should return true when paused', () => {
      Object.defineProperty(mockSpeechSynthesis, 'paused', { value: true, writable: true });

      const result = service.isPaused();

      expect(result).toBe(true);
    });

    it('should return false when not paused', () => {
      Object.defineProperty(mockSpeechSynthesis, 'paused', { value: false, writable: true });

      const result = service.isPaused();

      expect(result).toBe(false);
    });
  });

  describe('getVoices', () => {
    it('should return available voices', () => {
      const voices = service.getVoices();

      expect(voices).toEqual(mockVoices);
      expect(voices.length).toBe(3);
    });
  });

  describe('areVoicesLoaded', () => {
    it('should return true when voices are loaded', () => {
      // Voices are loaded in beforeEach
      const result = service.areVoicesLoaded();

      expect(result).toBe(true);
    });

    it('should return false initially when no voices', () => {
      mockSpeechSynthesis.getVoices.and.returnValue([]);

      const newService = new SpeechService();
      const result = newService.areVoicesLoaded();

      expect(result).toBe(false);
    });

    it('should update when voices are loaded asynchronously', (done) => {
      mockSpeechSynthesis.getVoices.and.returnValue([]);

      const newService = new SpeechService();
      expect(newService.areVoicesLoaded()).toBe(false);

      // Simulate voiceschanged event
      mockSpeechSynthesis.getVoices.and.returnValue(mockVoices);
      mockSpeechSynthesis.onvoiceschanged?.(new Event('voiceschanged'));

      setTimeout(() => {
        expect(newService.areVoicesLoaded()).toBe(true);
        done();
      }, 10);
    });
  });

  describe('isSpeechSupported', () => {
    it('should return true when speech synthesis is supported', () => {
      const result = service.isSpeechSupported();

      expect(result).toBe(true);
    });

    it('should return false when speech synthesis is not supported', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const newService = new SpeechService();
      const result = newService.isSpeechSupported();

      expect(result).toBe(false);
    });
  });

  describe('voice selection', () => {
    it('should prefer high-quality voices', async () => {
      let selectedVoice: SpeechSynthesisVoice | null = null;

      mockSpeechSynthesis.speak.and.callFake((utterance: SpeechSynthesisUtterance) => {
        selectedVoice = utterance.voice as SpeechSynthesisVoice | null;
        setTimeout(() => utterance.onstart?.(new Event('start') as any), 0);
      });

      await service.speak('Test');

      // Should select the Google voice
      expect(selectedVoice).toBeTruthy();
      expect((selectedVoice as any).name).toBe('Google US English');
    });

    it('should fallback to basic voice if no premium voices available', async () => {
      const basicVoices = [createMockVoice('English Basic', 'en-US', true, 'basic')];
      mockSpeechSynthesis.getVoices.and.returnValue(basicVoices);

      const newService = new SpeechService();
      let selectedVoice: SpeechSynthesisVoice | null = null;

      mockSpeechSynthesis.speak.and.callFake((utterance: SpeechSynthesisUtterance) => {
        selectedVoice = utterance.voice as SpeechSynthesisVoice | null;
        setTimeout(() => utterance.onstart?.(new Event('start') as any), 0);
      });

      await newService.speak('Test');

      expect(selectedVoice).toBeTruthy();
      expect((selectedVoice as any).name).toBe('English Basic');
    });
  });
});
