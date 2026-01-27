import { Injectable } from '@angular/core';

export interface ShareData {
  title?: string;
  text: string;
  url?: string;
}

export interface WindowFeatures {
  width?: number;
  height?: number;
  top?: number;
  left?: number;
}

/**
 * Service for handling sharing operations
 * Abstracts browser share API and social media sharing for better testability
 */
@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private readonly DEFAULT_POPUP_WIDTH = 600;
  private readonly DEFAULT_POPUP_HEIGHT = 400;

  /**
   * Share content using the native Web Share API
   * @param data The data to share
   * @returns Promise that resolves to true if successful, false otherwise
   */
  async share(data: ShareData): Promise<boolean> {
    if (!this.isNativeShareSupported()) {
      console.warn('Native sharing is not supported in this browser');
      return false;
    }

    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url
      });
      return true;
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to share:', error);
      }
      return false;
    }
  }

  /**
   * Share on Facebook
   * @param text The text/quote to share
   * @returns true if popup was opened successfully
   */
  shareOnFacebook(text: string): boolean {
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
    return this.openPopup(url, 'facebook-share');
  }

  /**
   * Share on Twitter/X
   * @param text The text/quote to share
   * @param url Optional URL to include in the tweet
   * @returns true if popup was opened successfully
   */
  shareOnTwitter(text: string, url?: string): boolean {
    let twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    if (url) {
      twitterUrl += `&url=${encodeURIComponent(url)}`;
    }
    return this.openPopup(twitterUrl, 'twitter-share');
  }

  /**
   * Share on LinkedIn
   * @param url The URL to share
   * @param title Optional title
   * @param summary Optional summary
   * @returns true if popup was opened successfully
   */
  shareOnLinkedIn(url: string, title?: string, summary?: string): boolean {
    let linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    if (title) {
      linkedInUrl += `&title=${encodeURIComponent(title)}`;
    }
    if (summary) {
      linkedInUrl += `&summary=${encodeURIComponent(summary)}`;
    }
    return this.openPopup(linkedInUrl, 'linkedin-share');
  }

  /**
   * Prepare for Instagram sharing by copying text to clipboard
   * Instagram doesn't have a direct share URL, so we copy the text
   * and open Instagram for the user to paste
   * @param text The text to copy
   * @param clipboardService The clipboard service to use
   * @returns Promise that resolves when text is copied
   */
  async prepareInstagramShare(text: string, clipboardService: { copyToClipboard: (text: string) => Promise<boolean> }): Promise<boolean> {
    const copied = await clipboardService.copyToClipboard(text);
    if (copied) {
      // Open Instagram in new tab
      window.open('https://www.instagram.com/', 'instagram-share');
      return true;
    }
    return false;
  }

  /**
   * Share via email
   * @param subject Email subject
   * @param body Email body
   * @returns true if mailto link was opened
   */
  shareViaEmail(subject: string, body: string): boolean {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      window.location.href = mailtoUrl;
      return true;
    } catch (error) {
      console.error('Failed to open email client:', error);
      return false;
    }
  }

  /**
   * Share via WhatsApp
   * @param text The text to share
   * @returns true if WhatsApp was opened successfully
   */
  shareOnWhatsApp(text: string): boolean {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    return this.openPopup(url, 'whatsapp-share');
  }

  /**
   * Check if native Web Share API is supported
   */
  isNativeShareSupported(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }

  /**
   * Open a popup window
   * @param url The URL to open
   * @param name The window name
   * @param features Optional window features
   * @returns true if window was opened successfully
   */
  private openPopup(url: string, name: string, features?: WindowFeatures): boolean {
    try {
      const width = features?.width ?? this.DEFAULT_POPUP_WIDTH;
      const height = features?.height ?? this.DEFAULT_POPUP_HEIGHT;

      // Center the popup on screen
      const left = features?.left ?? (window.screen.width / 2 - width / 2);
      const top = features?.top ?? (window.screen.height / 2 - height / 2);

      const featuresString = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`;

      const popup = window.open(url, name, featuresString);
      return popup !== null;
    } catch (error) {
      console.error('Failed to open popup:', error);
      return false;
    }
  }
}
