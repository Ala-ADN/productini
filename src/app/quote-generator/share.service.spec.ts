import { TestBed } from '@angular/core/testing';
import { ShareService } from './share.service';

describe('ShareService', () => {
  let service: ShareService;
  let windowOpenSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShareService]
    });
    service = TestBed.inject(ShareService);

    // Spy on window.open
    windowOpenSpy = spyOn(window, 'open').and.returnValue(window);
  });

  afterEach(() => {
    windowOpenSpy.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('share (native Web Share API)', () => {
    it('should share successfully when Web Share API is supported', async () => {
      const mockShare = jasmine.createSpy('share').and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true
      });

      const shareData = {
        title: 'Test Title',
        text: 'Test text',
        url: 'https://example.com'
      };

      const result = await service.share(shareData);

      expect(result).toBe(true);
      expect(mockShare).toHaveBeenCalledWith(shareData);
    });

    it('should return false when user cancels share', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      const mockShare = jasmine.createSpy('share').and.returnValue(Promise.reject(abortError));
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true
      });

      const shareData = { text: 'Test' };
      const result = await service.share(shareData);

      expect(result).toBe(false);
    });

    it('should return false and log error when share fails', async () => {
      const error = new Error('Share failed');
      const mockShare = jasmine.createSpy('share').and.returnValue(Promise.reject(error));
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true
      });

      spyOn(console, 'error');
      const shareData = { text: 'Test' };
      const result = await service.share(shareData);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to share:', error);
    });

    it('should return false when Web Share API is not supported', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true
      });

      spyOn(console, 'warn');
      const result = await service.share({ text: 'Test' });

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Native sharing is not supported in this browser');
    });
  });

  describe('shareOnFacebook', () => {
    it('should open Facebook share dialog with encoded text', () => {
      const text = 'Check out this quote!';

      const result = service.shareOnFacebook(text);

      expect(result).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalled();

      const [url, name, features] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain('facebook.com/sharer/sharer.php');
      expect(url).toContain(encodeURIComponent(text));
      expect(name).toBe('facebook-share');
      expect(features).toContain('width=600');
      expect(features).toContain('height=400');
    });

    it('should handle special characters in text', () => {
      const text = 'Quote with "special" & <chars>';

      service.shareOnFacebook(text);

      const [url] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain(encodeURIComponent(text));
    });

    it('should return false when window.open fails', () => {
      windowOpenSpy.and.returnValue(null);

      const result = service.shareOnFacebook('test');

      expect(result).toBe(false);
    });
  });

  describe('shareOnTwitter', () => {
    it('should open Twitter share dialog with text only', () => {
      const text = 'Amazing quote!';

      const result = service.shareOnTwitter(text);

      expect(result).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalled();

      const [url, name] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain('twitter.com/intent/tweet');
      expect(url).toContain(`text=${encodeURIComponent(text)}`);
      expect(name).toBe('twitter-share');
    });

    it('should include URL when provided', () => {
      const text = 'Check this out';
      const shareUrl = 'https://example.com';

      service.shareOnTwitter(text, shareUrl);

      const [url] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain(`text=${encodeURIComponent(text)}`);
      expect(url).toContain(`url=${encodeURIComponent(shareUrl)}`);
    });

    it('should handle special characters', () => {
      const text = 'Tweet with #hashtag & @mention';

      service.shareOnTwitter(text);

      const [url] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain(encodeURIComponent(text));
    });
  });

  describe('shareOnLinkedIn', () => {
    it('should open LinkedIn share dialog with URL only', () => {
      const shareUrl = 'https://example.com';

      const result = service.shareOnLinkedIn(shareUrl);

      expect(result).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalled();

      const [url, name] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain('linkedin.com/sharing/share-offsite');
      expect(url).toContain(`url=${encodeURIComponent(shareUrl)}`);
      expect(name).toBe('linkedin-share');
    });

    it('should include title when provided', () => {
      const shareUrl = 'https://example.com';
      const title = 'Article Title';

      service.shareOnLinkedIn(shareUrl, title);

      const [url] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain(`title=${encodeURIComponent(title)}`);
    });

    it('should include summary when provided', () => {
      const shareUrl = 'https://example.com';
      const title = 'Title';
      const summary = 'Article summary';

      service.shareOnLinkedIn(shareUrl, title, summary);

      const [url] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain(`summary=${encodeURIComponent(summary)}`);
    });
  });

  describe('prepareInstagramShare', () => {
    it('should copy text and open Instagram when successful', async () => {
      const text = 'Instagram quote';
      const mockClipboardService = {
        copyToClipboard: jasmine.createSpy('copyToClipboard').and.returnValue(Promise.resolve(true))
      };

      const result = await service.prepareInstagramShare(text, mockClipboardService);

      expect(result).toBe(true);
      expect(mockClipboardService.copyToClipboard).toHaveBeenCalledWith(text);
      expect(windowOpenSpy).toHaveBeenCalled();

      const [url, name] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain('instagram.com');
      expect(name).toBe('instagram-share');
    });

    it('should return false when clipboard copy fails', async () => {
      const text = 'Test';
      const mockClipboardService = {
        copyToClipboard: jasmine.createSpy('copyToClipboard').and.returnValue(Promise.resolve(false))
      };

      const result = await service.prepareInstagramShare(text, mockClipboardService);

      expect(result).toBe(false);
      expect(windowOpenSpy).not.toHaveBeenCalled();
    });
  });

  describe('shareViaEmail', () => {
    it('should create mailto link with subject and body', () => {
      const subject = 'Check this quote';
      const body = 'Here is an inspiring quote...';

      // Spy on location.href setter
      const locationHrefSpy = spyOnProperty(window.location, 'href', 'set');

      const result = service.shareViaEmail(subject, body);

      expect(result).toBe(true);
      expect(locationHrefSpy).toHaveBeenCalled();

      const mailtoUrl = locationHrefSpy.calls.mostRecent().args[0];
      expect(mailtoUrl).toContain('mailto:?');
      expect(mailtoUrl).toContain(`subject=${encodeURIComponent(subject)}`);
      expect(mailtoUrl).toContain(`body=${encodeURIComponent(body)}`);
    });

    it('should handle special characters in subject and body', () => {
      const subject = 'Subject with & and ?';
      const body = 'Body with <> and "quotes"';

      const locationHrefSpy = spyOnProperty(window.location, 'href', 'set');

      service.shareViaEmail(subject, body);

      const mailtoUrl = locationHrefSpy.calls.mostRecent().args[0];
      expect(mailtoUrl).toContain(encodeURIComponent(subject));
      expect(mailtoUrl).toContain(encodeURIComponent(body));
    });
  });

  describe('shareOnWhatsApp', () => {
    it('should open WhatsApp with encoded text', () => {
      const text = 'Share on WhatsApp';

      const result = service.shareOnWhatsApp(text);

      expect(result).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalled();

      const [url, name] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain('wa.me');
      expect(url).toContain(`text=${encodeURIComponent(text)}`);
      expect(name).toBe('whatsapp-share');
    });

    it('should handle emojis in text', () => {
      const text = 'Quote with 💡 emoji';

      service.shareOnWhatsApp(text);

      const [url] = windowOpenSpy.calls.mostRecent().args;
      expect(url).toContain(encodeURIComponent(text));
    });
  });

  describe('isNativeShareSupported', () => {
    it('should return true when Web Share API is supported', () => {
      Object.defineProperty(navigator, 'share', {
        value: () => {},
        writable: true,
        configurable: true
      });

      const result = service.isNativeShareSupported();

      expect(result).toBe(true);
    });

    it('should return false when Web Share API is not supported', () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const result = service.isNativeShareSupported();

      expect(result).toBe(false);
    });
  });

  describe('popup positioning', () => {
    it('should center popup on screen', () => {
      spyOnProperty(window.screen, 'width', 'get').and.returnValue(1920);
      spyOnProperty(window.screen, 'height', 'get').and.returnValue(1080);

      service.shareOnFacebook('test');

      const [, , features] = windowOpenSpy.calls.mostRecent().args;

      // Should be centered: (1920/2 - 600/2) = 660, (1080/2 - 400/2) = 340
      expect(features).toContain('left=660');
      expect(features).toContain('top=340');
    });

    it('should include standard popup features', () => {
      service.shareOnTwitter('test');

      const [, , features] = windowOpenSpy.calls.mostRecent().args;
      expect(features).toContain('toolbar=no');
      expect(features).toContain('menubar=no');
      expect(features).toContain('scrollbars=yes');
      expect(features).toContain('resizable=yes');
    });
  });

  describe('error handling', () => {
    it('should handle window.open throwing an error', () => {
      windowOpenSpy.and.throwError('Popup blocked');
      spyOn(console, 'error');

      const result = service.shareOnFacebook('test');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to open popup:', jasmine.any(Error));
    });
  });
});
