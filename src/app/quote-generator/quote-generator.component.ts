import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { liveQuery } from 'dexie';
import { QuoteService } from './quote.service';
import { ClipboardService } from './clipboard.service';
import { SpeechService } from './speech.service';
import { ShareService } from './share.service';
import type { Quote } from '../db';

const AUTOPLAY_INTERVAL_MS = 5000;
const SPEECH_RATE = 0.85;
const SPEECH_PITCH = 1.05;

@Component({
  selector: 'app-quote-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quote-generator.component.html',
  styleUrl: './quote-generator.component.css'
})
export class QuoteGeneratorComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private quoteService = inject(QuoteService);
  private clipboardService = inject(ClipboardService);
  private speechService = inject(SpeechService);
  private shareService = inject(ShareService);

  // Signals for reactive state management
  private quotesSignal = toSignal(liveQuery(() => this.quoteService.getAllQuotes()), { initialValue: [] as Quote[] });
  
  // Type-safe quotes accessor
  quotes = computed(() => this.quotesSignal() as Quote[]);

  currentQuoteId = signal<number | null>(null);
  clickCount = signal<number>(0);
  isAutoPlay = signal<boolean>(false);
  selectedCategory = signal<string>('All');
  showAddQuoteForm = signal<boolean>(false);
  newQuoteText = signal<string>('');
  newQuoteAuthor = signal<string>('');
  newQuoteCategory = signal<string>('');

  // Computed signals - derived state
  currentQuote = computed(() => {
    const quotes = this.quotes();
    const id = this.currentQuoteId();
    if (id === null || quotes.length === 0) return null;
    return quotes.find((q: Quote) => q.id === id) || quotes[0];
  });

  currentQuoteNumber = computed(() => {
    const quotes = this.quotes();
    const current = this.currentQuote();
    if (!current) return 0;
    const index = quotes.findIndex((q: Quote) => q.id === current.id);
    return index + 1;
  });
  
  quoteCount = computed(() => this.quotes().length);
  
  categories = computed(() => {
    const cats = new Set(this.quotes().map((q: Quote) => q.category));
    return ['All', ...Array.from(cats).sort()];
  });

  filteredQuotes = computed(() => {
    const category = this.selectedCategory();
    if (category === 'All') {
      return this.quotes();
    }
    return this.quotes().filter((q: Quote) => q.category === category);
  });

  isFavorite = computed(() => {
    const quote = this.currentQuote();
    return quote?.isFavorite || false;
  });

  favoriteCount = computed(() => {
    return this.quotes().filter((q: Quote) => q.isFavorite).length;
  });

  // Effects - side effects based on signal changes
  constructor() {
    // Auto-play functionality
    interval(AUTOPLAY_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isAutoPlay()) {
          this.generateNewQuote();
        }
      });
  }

  async ngOnInit(): Promise<void> {
    // Initialize default quotes if database is empty
    await this.quoteService.initializeDefaultQuotes();

    // Set first quote as current
    const quotes = await this.quoteService.getAllQuotes();
    if (quotes.length > 0) {
      this.currentQuoteId.set(quotes[0].id!);
    }
  }

  // Methods
  generateNewQuote(): void {
    this.clickCount.update(count => count + 1);
    
    const allQuotes = this.quotes();
    if (allQuotes.length === 0) return;
    
    let newQuote: Quote;
    const currentId = this.currentQuoteId();
    
    // Always pick from ALL quotes for true random experience
    do {
      const randomIndex = Math.floor(Math.random() * allQuotes.length);
      newQuote = allQuotes[randomIndex];
    } while (newQuote.id === currentId && allQuotes.length > 1);
    
    this.currentQuoteId.set(newQuote.id!);
    
    // Update selected category to match the new quote's category
    this.selectedCategory.set(newQuote.category);
  }

  nextQuote(): void {
    const filtered = this.filteredQuotes();
    if (filtered.length === 0) return;
    
    const currentQuote = this.currentQuote();
    let currentIndexInFiltered = filtered.findIndex((q: Quote) => q.id === currentQuote?.id);
    
    // If current quote not in filtered list, start from beginning
    if (currentIndexInFiltered === -1) {
      currentIndexInFiltered = -1;
    }
    
    const nextIndexInFiltered = (currentIndexInFiltered + 1) % filtered.length;
    const nextQuote = filtered[nextIndexInFiltered];
    this.currentQuoteId.set(nextQuote.id!);
    this.clickCount.update(count => count + 1);
  }

  previousQuote(): void {
    const filtered = this.filteredQuotes();
    if (filtered.length === 0) return;
    
    const currentQuote = this.currentQuote();
    let currentIndexInFiltered = filtered.findIndex((q: Quote) => q.id === currentQuote?.id);
    
    // If current quote not in filtered list, start from end
    if (currentIndexInFiltered === -1) {
      currentIndexInFiltered = 0;
    }
    
    const previousIndexInFiltered = (currentIndexInFiltered - 1 + filtered.length) % filtered.length;
    const previousQuote = filtered[previousIndexInFiltered];
    this.currentQuoteId.set(previousQuote.id!);
    this.clickCount.update(count => count + 1);
  }

  async toggleFavorite(): Promise<void> {
    const quote = this.currentQuote();
    if (quote?.id) {
      await this.quoteService.toggleFavorite(quote.id);
    }
  }

  toggleAutoPlay(): void {
    this.isAutoPlay.update(state => !state);
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    // Reset to first quote of filtered category
    if (this.filteredQuotes().length > 0) {
      const firstQuote = this.filteredQuotes()[0];
      this.currentQuoteId.set(firstQuote.id!);
    }
  }

  async copyToClipboard(): Promise<void> {
    const quote = this.currentQuote();
    if (!quote) return;
    const text = `"${quote.text}" - ${quote.author}`;
    await this.clipboardService.copyToClipboard(text);
    // TODO: Add user feedback (toast/snackbar)
  }

  async shareQuote(): Promise<void> {
    const quote = this.currentQuote();
    if (!quote) return;
    const text = `"${quote.text}" - ${quote.author}`;
    await this.shareService.share({
      title: 'Motivational Quote',
      text: text
    });
    // TODO: Add user feedback if native share is not supported
  }

  shareOnFacebook(): void {
    const quote = this.currentQuote();
    if (!quote) return;
    const text = `"${quote.text}" - ${quote.author}`;
    this.shareService.shareOnFacebook(text);
  }

  shareOnTwitter(): void {
    const quote = this.currentQuote();
    if (!quote) return;
    const text = `"${quote.text}" - ${quote.author}`;
    this.shareService.shareOnTwitter(text);
  }

  async shareOnInstagram(): Promise<void> {
    const quote = this.currentQuote();
    if (!quote) return;
    const text = `"${quote.text}" - ${quote.author}`;

    await this.shareService.prepareInstagramShare(text, this.clipboardService);
    // TODO: Add user feedback that text was copied
  }

  async readQuote(): Promise<void> {
    const quote = this.currentQuote();
    if (!quote) return;

    const text = `${quote.text}. By ${quote.author}`;

    try {
      await this.speechService.speak(text, {
        rate: SPEECH_RATE,
        pitch: SPEECH_PITCH,
        volume: 1
      });
      // TODO: Add visual feedback when speech starts
    } catch (error) {
      console.error('Failed to read quote:', error);
      // TODO: Show user-friendly error message
    }
  }

  toggleAddQuoteForm(): void {
    this.showAddQuoteForm.update(state => !state);
    // Reset form when closing
    if (!this.showAddQuoteForm()) {
      this.newQuoteText.set('');
      this.newQuoteAuthor.set('');
      this.newQuoteCategory.set('');
    }
  }

  async addCustomQuote(): Promise<void> {
    const text = this.newQuoteText().trim();
    const author = this.newQuoteAuthor().trim() || 'Anonymous';
    const category = this.newQuoteCategory().trim() || 'Custom';

    if (!text) return;

    const newQuoteId = await this.quoteService.addQuote({ 
      text, 
      author, 
      category,
      createdAt: Date.now(),
      isFavorite: false
    });
    
    // Navigate to the new quote
    this.currentQuoteId.set(newQuoteId);
    
    // Reset form and close
    this.toggleAddQuoteForm();
  }

  async deleteQuote(): Promise<void> {
    const allQuotes = this.quotes();
    if (allQuotes.length <= 1) {
      return;
    }

    const quote = this.currentQuote();
    if (!quote || !quote.id) return;

    // Find next quote before deletion
    const filtered = this.filteredQuotes();
    const currentIndex = filtered.findIndex((q: Quote) => q.id === quote.id);
    let nextQuote: Quote | undefined;
    
    if (currentIndex < filtered.length - 1) {
      nextQuote = filtered[currentIndex + 1];
    } else if (filtered.length > 1) {
      nextQuote = filtered[currentIndex - 1];
    } else if (allQuotes.length > 1) {
      nextQuote = allQuotes.find((q: Quote) => q.id !== quote.id);
    }

    // Remove the quote from database
    await this.quoteService.deleteQuote(quote.id);

    // Check if the selected category still exists after deletion
    const updatedCategories = this.categories();
    if (!updatedCategories.includes(this.selectedCategory())) {
      this.selectedCategory.set('All');
    }

    // Navigate to next quote
    if (nextQuote?.id) {
      this.currentQuoteId.set(nextQuote.id);
    } else {
      // Fallback to first available quote
      const remainingQuotes = await this.quoteService.getAllQuotes();
      if (remainingQuotes.length > 0) {
        this.currentQuoteId.set(remainingQuotes[0].id!);
      }
    }
  }
}
