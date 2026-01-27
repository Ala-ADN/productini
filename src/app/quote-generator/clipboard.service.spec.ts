import { TestBed } from '@angular/core/testing';
import { ClipboardService } from './clipboard.service';

describe('ClipboardService', () => {
  let service: ClipboardService;
  let mockClipboard: jasmine.SpyObj<Clipboard>;

  beforeEach(() => {
    // Create a mock clipboard object
    mockClipboard = jasmine.createSpyObj('Clipboard', ['writeText', 'readText']);

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true
    });

    TestBed.configureTestingModule({
      providers: [ClipboardService]
    });
    service = TestBed.inject(ClipboardService);
  });

  afterEach(() => {
    // Clean up
    mockClipboard.writeText.calls.reset();
    mockClipboard.readText.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard successfully', async () => {
      const testText = 'Test quote';
      mockClipboard.writeText.and.returnValue(Promise.resolve());

      const result = await service.copyToClipboard(testText);

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(testText);
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
    });

    it('should return false when clipboard write fails', async () => {
      const testText = 'Test quote';
      const error = new Error('Clipboard write failed');
      mockClipboard.writeText.and.returnValue(Promise.reject(error));

      spyOn(console, 'error');
      const result = await service.copyToClipboard(testText);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to copy to clipboard:', error);
    });

    it('should handle empty text', async () => {
      mockClipboard.writeText.and.returnValue(Promise.resolve());

      const result = await service.copyToClipboard('');

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });

    it('should handle special characters', async () => {
      const specialText = '"Quote with special chars: <>&\'"';
      mockClipboard.writeText.and.returnValue(Promise.resolve());

      const result = await service.copyToClipboard(specialText);

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(specialText);
    });
  });

  describe('readFromClipboard', () => {
    it('should read text from clipboard successfully', async () => {
      const expectedText = 'Clipboard content';
      mockClipboard.readText.and.returnValue(Promise.resolve(expectedText));

      const result = await service.readFromClipboard();

      expect(result).toBe(expectedText);
      expect(mockClipboard.readText).toHaveBeenCalledTimes(1);
    });

    it('should return null when clipboard read fails', async () => {
      const error = new Error('Clipboard read failed');
      mockClipboard.readText.and.returnValue(Promise.reject(error));

      spyOn(console, 'error');
      const result = await service.readFromClipboard();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to read from clipboard:', error);
    });

    it('should handle empty clipboard', async () => {
      mockClipboard.readText.and.returnValue(Promise.resolve(''));

      const result = await service.readFromClipboard();

      expect(result).toBe('');
    });
  });

  describe('isClipboardSupported', () => {
    it('should return true when clipboard API is available', () => {
      const result = service.isClipboardSupported();

      expect(result).toBe(true);
    });

    it('should return false when clipboard API is not available', () => {
      // Temporarily remove clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const result = service.isClipboardSupported();

      expect(result).toBe(false);
    });
  });
});
