import { Injectable } from '@nestjs/common';

interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Get or set a value in cache
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let totalItems = 0;
    let expiredItems = 0;
    let totalSize = 0;

    for (const [key, item] of this.cache.entries()) {
      totalItems++;
      totalSize += JSON.stringify(item.value).length;
      
      if (now > item.expiresAt) {
        expiredItems++;
      }
    }

    return {
      totalItems,
      expiredItems,
      activeItems: totalItems - expiredItems,
      totalSize,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Clean expired items
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Generate cache key for user data
   */
  getUserKey(userId: number): string {
    return `user:${userId}`;
  }

  /**
   * Generate cache key for top users
   */
  getTopUsersKey(): string {
    return 'top_users';
  }

  /**
   * Generate cache key for user count
   */
  getUserCountKey(): string {
    return 'user_count';
  }

  /**
   * Invalidate user-related cache
   */
  invalidateUser(userId: number): void {
    this.delete(this.getUserKey(userId));
    this.delete(this.getTopUsersKey());
    this.delete(this.getUserCountKey());
  }

  /**
   * Invalidate all leaderboard cache
   */
  invalidateLeaderboard(): void {
    this.delete(this.getTopUsersKey());
  }

  private hitRate = { hits: 0, misses: 0 };

  private calculateHitRate(): number {
    const total = this.hitRate.hits + this.hitRate.misses;
    return total > 0 ? (this.hitRate.hits / total) * 100 : 0;
  }

  private recordHit(): void {
    this.hitRate.hits++;
  }

  private recordMiss(): void {
    this.hitRate.misses++;
  }
}
