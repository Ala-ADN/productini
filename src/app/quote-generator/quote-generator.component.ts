import { Component, signal, computed, effect, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

interface Quote {
  text: string;
  author: string;
  category: string;
}

@Component({
  selector: 'app-quote-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quote-generator.component.html',
  styleUrl: './quote-generator.component.css'
})
export class QuoteGeneratorComponent {
  private destroyRef = inject(DestroyRef);
  
  // Signals for reactive state management
  quotes = signal<Quote[]>([
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Work" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "Belief" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "Success" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Persistence" },
    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair", category: "Fear" },
    { text: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.", author: "Roy T. Bennett", category: "Self-belief" },
    { text: "I learned that courage was not the absence of fear, but the triumph over it.", author: "Nelson Mandela", category: "Courage" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "Beginning" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown", category: "Imagination" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown", category: "Motivation" },
    { text: "Great things never come from comfort zones.", author: "Unknown", category: "Growth" },
    { text: "Dream it. Wish it. Do it.", author: "Unknown", category: "Action" },
    { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown", category: "Success" },
    { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown", category: "Achievement" },
    { text: "Dream bigger. Do bigger.", author: "Unknown", category: "Dreams" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown", category: "Persistence" },
    { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown", category: "Dedication" },
    { text: "Do something today that your future self will thank you for.", author: "Unknown", category: "Action" },
    { text: "Little things make big days.", author: "Unknown", category: "Gratitude" }
  ]);

  currentQuoteIndex = signal<number>(0);
  clickCount = signal<number>(0);
  isAutoPlay = signal<boolean>(false);
  favoriteQuotes = signal<number[]>([]);
  selectedCategory = signal<string>('All');
  showAddQuoteForm = signal<boolean>(false);
  newQuoteText = signal<string>('');
  newQuoteAuthor = signal<string>('');
  newQuoteCategory = signal<string>('');

  // Computed signals - derived state
  currentQuote = computed(() => this.quotes()[this.currentQuoteIndex()]);
  
  quoteCount = computed(() => this.quotes().length);
  
  categories = computed(() => {
    const cats = new Set(this.quotes().map(q => q.category));
    return ['All', ...Array.from(cats).sort()];
  });

  filteredQuotes = computed(() => {
    const category = this.selectedCategory();
    if (category === 'All') {
      return this.quotes();
    }
    return this.quotes().filter(q => q.category === category);
  });

  isFavorite = computed(() => 
    this.favoriteQuotes().includes(this.currentQuoteIndex())
  );

  progressPercentage = computed(() => 
    ((this.currentQuoteIndex() + 1) / this.quoteCount()) * 100
  );

  // Effects - side effects based on signal changes
  constructor() {
    // Log when quote changes
    effect(() => {
      const quote = this.currentQuote();
      console.log(`Current quote: "${quote.text}" by ${quote.author}`);
    });

    // Auto-save favorites to localStorage
    effect(() => {
      const favorites = this.favoriteQuotes();
      localStorage.setItem('favoriteQuotes', JSON.stringify(favorites));
    });

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteQuotes');
    if (savedFavorites) {
      this.favoriteQuotes.set(JSON.parse(savedFavorites));
    }

    // Auto-play functionality
    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isAutoPlay()) {
          this.generateNewQuote();
        }
      });
  }

  // Methods
  generateNewQuote(): void {
    this.clickCount.update(count => count + 1);
    
    const allQuotes = this.quotes();
    if (allQuotes.length === 0) return;
    
    let newIndex: number;
    
    // Always pick from ALL quotes for true random experience
    do {
      newIndex = Math.floor(Math.random() * allQuotes.length);
    } while (newIndex === this.currentQuoteIndex() && allQuotes.length > 1);
    
    this.currentQuoteIndex.set(newIndex);
    
    // Update selected category to match the new quote's category
    const newQuote = allQuotes[newIndex];
    this.selectedCategory.set(newQuote.category);
  }

  nextQuote(): void {
    const filtered = this.filteredQuotes();
    if (filtered.length === 0) return;
    
    const currentQuote = this.currentQuote();
    let currentIndexInFiltered = filtered.indexOf(currentQuote);
    
    // If current quote not in filtered list, start from beginning
    if (currentIndexInFiltered === -1) {
      currentIndexInFiltered = -1;
    }
    
    const nextIndexInFiltered = (currentIndexInFiltered + 1) % filtered.length;
    const nextQuote = filtered[nextIndexInFiltered];
    const newIndex = this.quotes().indexOf(nextQuote);
    this.currentQuoteIndex.set(newIndex);
    this.clickCount.update(count => count + 1);
  }

  previousQuote(): void {
    const filtered = this.filteredQuotes();
    if (filtered.length === 0) return;
    
    const currentQuote = this.currentQuote();
    let currentIndexInFiltered = filtered.indexOf(currentQuote);
    
    // If current quote not in filtered list, start from end
    if (currentIndexInFiltered === -1) {
      currentIndexInFiltered = 0;
    }
    
    const previousIndexInFiltered = (currentIndexInFiltered - 1 + filtered.length) % filtered.length;
    const previousQuote = filtered[previousIndexInFiltered];
    const newIndex = this.quotes().indexOf(previousQuote);
    this.currentQuoteIndex.set(newIndex);
    this.clickCount.update(count => count + 1);
  }

  toggleFavorite(): void {
    const currentIndex = this.currentQuoteIndex();
    this.favoriteQuotes.update(favorites => {
      if (favorites.includes(currentIndex)) {
        return favorites.filter(idx => idx !== currentIndex);
      } else {
        return [...favorites, currentIndex];
      }
    });
  }

  toggleAutoPlay(): void {
    this.isAutoPlay.update(state => !state);
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    // Reset to first quote of filtered category
    if (this.filteredQuotes().length > 0) {
      const firstQuote = this.filteredQuotes()[0];
      const newIndex = this.quotes().indexOf(firstQuote);
      this.currentQuoteIndex.set(newIndex);
    }
  }

  copyToClipboard(): void {
    const quote = this.currentQuote();
    const text = `"${quote.text}" - ${quote.author}`;
    navigator.clipboard.writeText(text);
  }

  shareQuote(): void {
    const quote = this.currentQuote();
    const text = `"${quote.text}" - ${quote.author}`;
    if (navigator.share) {
      navigator.share({
        title: 'Motivational Quote',
        text: text
      });
    }
  }

  shareOnFacebook(): void {
    const quote = this.currentQuote();
    const text = `"${quote.text}" - ${quote.author}`;
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
    window.open(url, 'facebook-share', 'width=600,height=400');
  }

  shareOnTwitter(): void {
    const quote = this.currentQuote();
    const text = `"${quote.text}" - ${quote.author}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, 'twitter-share', 'width=600,height=400');
  }

  shareOnInstagram(): void {
    const quote = this.currentQuote();
    const text = `"${quote.text}" - ${quote.author}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      // Show alert
      alert('Quote copied to clipboard! ✓\n\nPaste it in your Instagram post or story.');
      
      // Open Instagram in new tab
      window.open('https://www.instagram.com/', 'instagram-share');
    });
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

  addCustomQuote(): void {
    const text = this.newQuoteText().trim();
    const author = this.newQuoteAuthor().trim() || 'Anonymous';
    const category = this.newQuoteCategory().trim() || 'Custom';

    if (!text) return;

    const newQuote: Quote = { text, author, category };
    this.quotes.update(quotes => [...quotes, newQuote]);
    
    // Navigate to the new quote
    this.currentQuoteIndex.set(this.quotes().length - 1);
    
    // Reset form and close
    this.toggleAddQuoteForm();
  }
}
