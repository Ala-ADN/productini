import { Injectable } from '@angular/core';

/**
 * Service for handling clipboard operations
 * Abstracts browser clipboard API for better testability
 */
@Injectable({
  providedIn: 'root'
})
export class ClipboardService {

  /**
   * Copy text to clipboard
   * @param text The text to copy
   * @returns Promise that resolves to true if successful, false otherwise
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Read text from clipboard
   * @returns Promise that resolves to clipboard text or null if failed
   */
  async readFromClipboard(): Promise<string | null> {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      return null;
    }
  }

  /**
   * Check if clipboard API is available
   * @returns true if clipboard API is supported
   */
  isClipboardSupported(): boolean {
    return !!navigator.clipboard;
  }
}
