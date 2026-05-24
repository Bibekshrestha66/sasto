/**
 * Client-side caching utilities for performance optimization
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a value from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove a specific key from cache
   */
  remove(key: string): void {
    this.cache.delete(key);
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
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        age: Date.now() - value.timestamp,
        ttl: value.ttl,
      })),
    };
  }
}

/**
 * Image optimization utilities
 */
export const imageOptimization = {
  /**
   * Generate optimized image URL with size parameters
   */
  getOptimizedUrl(url: string, width: number, height?: number): string {
    if (!url) return '';

    // For S3 URLs, add size parameters
    if (url.includes('s3') || url.includes('amazonaws')) {
      const params = new URLSearchParams();
      params.append('w', width.toString());
      if (height) params.append('h', height.toString());
      params.append('q', '80'); // Quality
      params.append('fm', 'webp'); // Format

      return `${url}?${params.toString()}`;
    }

    return url;
  },

  /**
   * Lazy load images
   */
  lazyLoadImage(img: HTMLImageElement): void {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement;
            image.src = image.dataset.src || '';
            image.classList.remove('lazy');
            observer.unobserve(image);
          }
        });
      });

      observer.observe(img);
    } else {
      // Fallback for older browsers
      img.src = img.dataset.src || '';
    }
  },

  /**
   * Preload images
   */
  preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
          })
      )
    );
  },
};

/**
 * API response caching
 */
export const apiCache = {
  manager: new CacheManager(),

  /**
   * Get cached API response
   */
  get<T>(endpoint: string): T | null {
    return this.manager.get<T>(`api:${endpoint}`);
  },

  /**
   * Set API response cache
   */
  set<T>(endpoint: string, data: T, ttl?: number): void {
    this.manager.set(`api:${endpoint}`, data, ttl);
  },

  /**
   * Invalidate API cache
   */
  invalidate(endpoint: string): void {
    this.manager.remove(`api:${endpoint}`);
  },

  /**
   * Clear all API cache
   */
  clearAll(): void {
    this.manager.clear();
  },
};

/**
 * Local storage utilities with expiration
 */
export const persistentCache = {
  /**
   * Set value in localStorage with expiration
   */
  set(key: string, value: any, ttl: number = 24 * 60 * 60 * 1000): void {
    const item = {
      value,
      timestamp: Date.now(),
      ttl,
    };
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn('LocalStorage quota exceeded:', e);
    }
  },

  /**
   * Get value from localStorage if not expired
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`cache:${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }

      return parsed.value as T;
    } catch (e) {
      return null;
    }
  },

  /**
   * Remove from localStorage
   */
  remove(key: string): void {
    localStorage.removeItem(`cache:${key}`);
  },

  /**
   * Clear all persistent cache
   */
  clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('cache:')) {
        localStorage.removeItem(key);
      }
    });
  },
};

/**
 * Request deduplication
 */
export const requestDeduplication = {
  pending: new Map<string, Promise<any>>(),

  /**
   * Execute request with deduplication
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Return existing promise if request is already in flight
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    // Execute request and cache the promise
    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  },
};

/**
 * Performance monitoring
 */
export const performanceMonitoring = {
  metrics: new Map<string, number[]>(),

  /**
   * Record metric
   */
  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  },

  /**
   * Get metric statistics
   */
  getStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  },

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear();
  },
};

export default {
  apiCache,
  persistentCache,
  imageOptimization,
  requestDeduplication,
  performanceMonitoring,
};
