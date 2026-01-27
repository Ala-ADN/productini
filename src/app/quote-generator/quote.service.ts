import { Injectable } from '@angular/core';
import { db } from '../db';
import type { Quote } from '../db';

const DEFAULT_QUOTES: Omit<Quote, 'id'>[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Work", createdAt: Date.now(), isFavorite: false },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "Belief", createdAt: Date.now(), isFavorite: false },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "Success", createdAt: Date.now(), isFavorite: false },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams", createdAt: Date.now(), isFavorite: false },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Persistence", createdAt: Date.now(), isFavorite: false },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair", category: "Fear", createdAt: Date.now(), isFavorite: false },
  { text: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.", author: "Roy T. Bennett", category: "Self-belief", createdAt: Date.now(), isFavorite: false },
  { text: "I learned that courage was not the absence of fear, but the triumph over it.", author: "Nelson Mandela", category: "Courage", createdAt: Date.now(), isFavorite: false },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "Beginning", createdAt: Date.now(), isFavorite: false },
  { text: "Your limitation—it's only your imagination.", author: "Unknown", category: "Imagination", createdAt: Date.now(), isFavorite: false },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown", category: "Motivation", createdAt: Date.now(), isFavorite: false },
  { text: "Great things never come from comfort zones.", author: "Unknown", category: "Growth", createdAt: Date.now(), isFavorite: false },
  { text: "Dream it. Wish it. Do it.", author: "Unknown", category: "Action", createdAt: Date.now(), isFavorite: false },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown", category: "Success", createdAt: Date.now(), isFavorite: false },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown", category: "Achievement", createdAt: Date.now(), isFavorite: false },
  { text: "Dream bigger. Do bigger.", author: "Unknown", category: "Dreams", createdAt: Date.now(), isFavorite: false },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown", category: "Persistence", createdAt: Date.now(), isFavorite: false },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown", category: "Dedication", createdAt: Date.now(), isFavorite: false },
  { text: "Do something today that your future self will thank you for.", author: "Unknown", category: "Action", createdAt: Date.now(), isFavorite: false },
  { text: "Little things make big days.", author: "Unknown", category: "Gratitude", createdAt: Date.now(), isFavorite: false }
];

@Injectable({
  providedIn: 'root'
})
export class QuoteService {

  async getAllQuotes(): Promise<Quote[]> {
    return db.quotes.toArray();
  }

  async getQuoteById(id: number): Promise<Quote | undefined> {
    return db.quotes.get(id);
  }

  async addQuote(quote: Omit<Quote, 'id'>): Promise<number> {
    return db.quotes.add(quote);
  }

  async updateQuote(id: number, changes: Partial<Quote>): Promise<number> {
    return db.quotes.update(id, changes);
  }

  async deleteQuote(id: number): Promise<void> {
    await db.quotes.delete(id);
  }

  async toggleFavorite(id: number): Promise<void> {
    const quote = await db.quotes.get(id);
    if (quote) {
      await db.quotes.update(id, { isFavorite: !quote.isFavorite });
    }
  }

  async getFavoriteQuotes(): Promise<Quote[]> {
    return db.quotes.where('isFavorite').equals(1).toArray();
  }

  async getQuotesByCategory(category: string): Promise<Quote[]> {
    if (category === 'All') {
      return this.getAllQuotes();
    }
    return db.quotes.where('category').equals(category).toArray();
  }

  async getCategories(): Promise<string[]> {
    const quotes = await this.getAllQuotes();
    const cats = new Set(quotes.map(q => q.category));
    return ['All', ...Array.from(cats).sort()];
  }

  async initializeDefaultQuotes(): Promise<void> {
    const count = await db.quotes.count();
    if (count === 0) {
      await db.quotes.bulkAdd(DEFAULT_QUOTES);
    }
  }

  async resetToDefaultQuotes(): Promise<void> {
    await db.quotes.clear();
    await db.quotes.bulkAdd(DEFAULT_QUOTES);
  }
}
