import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface CacheEntry {
  key: string;
  data: Buffer | any;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number;
  metadata?: Record<string, any>;
}

export interface CacheConfig {
  maxSizeBytes: number;
  maxEntries: number;
  ttlMs: number;
  compressionEnabled: boolean;
  persistToDisk: boolean;
  cacheDirectory: string;
}

export interface CacheStats {
  totalEntries: number;
  totalSizeBytes: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

export class ScreenshotCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupInterval?: NodeJS.Timeout;
  private enabled: boolean;

  constructor(enabled: boolean = true, config?: Partial<CacheConfig>) {
    this.enabled = enabled;
    this.config = {
      maxSizeBytes: 500 * 1024 * 1024, // 500MB
      maxEntries: 1000,
      ttlMs: 24 * 60 * 60 * 1000, // 24 hours
      compressionEnabled: true,
      persistToDisk: true,
      cacheDirectory: path.join(process.cwd(), 'test-results', 'cache'),
      ...config
    };

    this.stats = {
      totalEntries: 0,
      totalSizeBytes: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0
    };
  }

  async initialize(): Promise<void> {
    if (!this.enabled) {
      console.log('📦 Screenshot cache disabled');
      return;
    }

    console.log('📦 Initializing screenshot cache...');
    
    // Create cache directory
    if (this.config.persistToDisk) {
      await fs.mkdir(this.config.cacheDirectory, { recursive: true });
      
      // Load existing cache from disk
      await this.loadCacheFromDisk();
    }
    
    // Start cleanup interval
    this.startCleanupInterval();
    
    console.log(`✅ Screenshot cache initialized with ${this.cache.size} entries`);
  }

  async get(key: string): Promise<any | null> {
    if (!this.enabled) return null;

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.missCount++;
      this.updateHitRate();
      return null;
    }

    // Check TTL
    const now = new Date();
    const age = now.getTime() - entry.timestamp.getTime();
    
    if (age > this.config.ttlMs) {
      // Entry expired
      await this.delete(key);
      this.stats.missCount++;
      this.updateHitRate();
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.stats.hitCount++;
    this.updateHitRate();
    
    console.log(`📦 Cache hit for key: ${key}`);
    return entry.data;
  }

  async set(key: string, data: any, metadata?: Record<string, any>): Promise<void> {
    if (!this.enabled) return;

    // Calculate size
    const size = this.calculateSize(data);
    
    // Check if we need to make space
    await this.ensureSpace(size);
    
    const entry: CacheEntry = {
      key,
      data,
      timestamp: new Date(),
      accessCount: 1,
      lastAccessed: new Date(),
      size,
      metadata
    };

    this.cache.set(key, entry);
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSizeBytes += size;
    
    // Persist to disk if enabled
    if (this.config.persistToDisk) {
      await this.persistEntryToDisk(entry);
    }
    
    console.log(`📦 Cached entry: ${key} (${this.formatSize(size)})`);
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    this.cache.delete(key);
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSizeBytes -= entry.size;
    
    // Remove from disk if persisted
    if (this.config.persistToDisk) {
      await this.removeEntryFromDisk(key);
    }
    
    return true;
  }

  async clear(): Promise<void> {
    console.log('🧹 Clearing screenshot cache...');
    
    this.cache.clear();
    this.stats.totalEntries = 0;
    this.stats.totalSizeBytes = 0;
    
    // Clear disk cache
    if (this.config.persistToDisk) {
      try {
        await fs.rm(this.config.cacheDirectory, { recursive: true, force: true });
        await fs.mkdir(this.config.cacheDirectory, { recursive: true });
      } catch (error) {
        console.error('❌ Failed to clear disk cache:', error);
      }
    }
    
    console.log('✅ Cache cleared');
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    // Check size limit
    while (this.stats.totalSizeBytes + requiredSize > this.config.maxSizeBytes) {
      await this.evictLeastRecentlyUsed();
    }
    
    // Check entry limit
    while (this.cache.size >= this.config.maxEntries) {
      await this.evictLeastRecentlyUsed();
    }
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    if (this.cache.size === 0) return;
    
    let oldestEntry: CacheEntry | null = null;
    let oldestKey: string | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = entry;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      await this.delete(oldestKey);
      this.stats.evictionCount++;
      console.log(`📦 Evicted cache entry: ${oldestKey}`);
    }
  }

  private calculateSize(data: any): number {
    if (Buffer.isBuffer(data)) {
      return data.length;
    }
    
    if (typeof data === 'string') {
      return Buffer.byteLength(data, 'utf8');
    }
    
    // For objects, estimate size
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  private updateHitRate(): void {
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? this.stats.hitCount / total : 0;
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.performCleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async performCleanup(): Promise<void> {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now.getTime() - entry.timestamp.getTime();
      
      if (age > this.config.ttlMs) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      await this.delete(key);
    }
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  private async loadCacheFromDisk(): Promise<void> {
    try {
      const indexPath = path.join(this.config.cacheDirectory, 'index.json');
      const indexData = await fs.readFile(indexPath, 'utf8');
      const index = JSON.parse(indexData);
      
      for (const entryInfo of index.entries) {
        try {
          const entryPath = path.join(this.config.cacheDirectory, `${entryInfo.key}.cache`);
          const entryData = await fs.readFile(entryPath);
          
          const entry: CacheEntry = {
            key: entryInfo.key,
            data: entryData,
            timestamp: new Date(entryInfo.timestamp),
            accessCount: entryInfo.accessCount || 0,
            lastAccessed: new Date(entryInfo.lastAccessed || entryInfo.timestamp),
            size: entryInfo.size,
            metadata: entryInfo.metadata
          };
          
          // Check if entry is still valid
          const age = Date.now() - entry.timestamp.getTime();
          if (age <= this.config.ttlMs) {
            this.cache.set(entry.key, entry);
            this.stats.totalSizeBytes += entry.size;
          }
          
        } catch (error) {
          console.warn(`⚠️ Failed to load cache entry ${entryInfo.key}:`, error);
        }
      }
      
      this.stats.totalEntries = this.cache.size;
      console.log(`📦 Loaded ${this.cache.size} cache entries from disk`);
      
    } catch (error) {
      console.log('📦 No existing cache found on disk');
    }
  }

  private async persistEntryToDisk(entry: CacheEntry): Promise<void> {
    try {
      const entryPath = path.join(this.config.cacheDirectory, `${this.hashKey(entry.key)}.cache`);
      
      if (Buffer.isBuffer(entry.data)) {
        await fs.writeFile(entryPath, entry.data);
      } else {
        await fs.writeFile(entryPath, JSON.stringify(entry.data));
      }
      
      // Update index
      await this.updateDiskIndex();
      
    } catch (error) {
      console.error(`❌ Failed to persist cache entry ${entry.key}:`, error);
    }
  }

  private async removeEntryFromDisk(key: string): Promise<void> {
    try {
      const entryPath = path.join(this.config.cacheDirectory, `${this.hashKey(key)}.cache`);
      await fs.unlink(entryPath);
      await this.updateDiskIndex();
    } catch (error) {
      // Ignore file not found errors
      if ((error as any).code !== 'ENOENT') {
        console.error(`❌ Failed to remove cache entry ${key}:`, error);
      }
    }
  }

  private async updateDiskIndex(): Promise<void> {
    try {
      const index = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        entries: Array.from(this.cache.values()).map(entry => ({
          key: entry.key,
          timestamp: entry.timestamp.toISOString(),
          accessCount: entry.accessCount,
          lastAccessed: entry.lastAccessed.toISOString(),
          size: entry.size,
          metadata: entry.metadata
        }))
      };
      
      const indexPath = path.join(this.config.cacheDirectory, 'index.json');
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to update disk index:', error);
    }
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  async shutdown(): Promise<void> {
    if (!this.enabled) return;
    
    console.log('📦 Shutting down screenshot cache...');
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Final persist to disk
    if (this.config.persistToDisk) {
      await this.updateDiskIndex();
    }
    
    console.log('✅ Screenshot cache shut down');
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    
    return {
      ...this.stats,
      totalEntries: this.cache.size,
      oldestEntry: entries.length > 0 ? 
        new Date(Math.min(...entries.map(e => e.timestamp.getTime()))) : undefined,
      newestEntry: entries.length > 0 ? 
        new Date(Math.max(...entries.map(e => e.timestamp.getTime()))) : undefined
    };
  }

  getHitRate(): number {
    return this.stats.hitRate;
  }

  async optimize(): Promise<void> {
    console.log('🔧 Optimizing screenshot cache...');
    
    // Remove expired entries
    await this.performCleanup();
    
    // If still over size limit, remove least accessed entries
    while (this.stats.totalSizeBytes > this.config.maxSizeBytes * 0.8) {
      await this.evictLeastRecentlyUsed();
    }
    
    console.log('✅ Cache optimization complete');
  }
}