import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export interface ImageOptimizationOptions {
  quality: number;
  format: 'png' | 'jpeg' | 'webp';
  maxWidth?: number;
  maxHeight?: number;
  enableCompression: boolean;
  preserveMetadata: boolean;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  processingTime: number;
  hash: string;
}

export class ImageOptimizer {
  private cache = new Map<string, OptimizationResult>();
  private options: ImageOptimizationOptions;

  constructor(options: Partial<ImageOptimizationOptions> = {}) {
    this.options = {
      quality: options.quality || 80,
      format: options.format || 'webp',
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      enableCompression: options.enableCompression !== false,
      preserveMetadata: options.preserveMetadata || false
    };
  }

  async optimizeScreenshot(imagePath: string, outputPath?: string): Promise<OptimizationResult> {
    const startTime = performance.now();
    
    try {
      // Read original image
      const originalBuffer = await fs.readFile(imagePath);
      const originalSize = originalBuffer.length;
      const hash = this.generateHash(originalBuffer);

      // Check cache first
      if (this.cache.has(hash)) {
        return this.cache.get(hash)!;
      }

      // Optimize image
      const optimizedBuffer = await this.processImage(originalBuffer);
      const optimizedSize = optimizedBuffer.length;

      // Save optimized image
      const finalPath = outputPath || this.generateOptimizedPath(imagePath);
      await fs.writeFile(finalPath, optimizedBuffer);

      const result: OptimizationResult = {
        originalSize,
        optimizedSize,
        compressionRatio: (originalSize - optimizedSize) / originalSize,
        processingTime: performance.now() - startTime,
        hash
      };

      // Cache result
      this.cache.set(hash, result);
      
      return result;

    } catch (error) {
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  async batchOptimize(imagePaths: string[]): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];
    const batchSize = 5; // Process 5 images at a time

    for (let i = 0; i < imagePaths.length; i += batchSize) {
      const batch = imagePaths.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(path => this.optimizeScreenshot(path))
      );
      results.push(...batchResults);
    }

    return results;
  }

  private async processImage(buffer: Buffer): Promise<Buffer> {
    // Simulate image processing (in real implementation, use sharp or similar)
    // This is a placeholder that simulates compression
    
    if (!this.options.enableCompression) {
      return buffer;
    }

    // Simulate compression by reducing buffer size
    const compressionFactor = this.options.quality / 100;
    const targetSize = Math.floor(buffer.length * compressionFactor);
    
    // Create a new buffer with simulated compression
    const compressed = Buffer.alloc(targetSize);
    buffer.copy(compressed, 0, 0, targetSize);
    
    return compressed;
  }

  private generateHash(buffer: Buffer): string {
    return createHash('md5').update(buffer).digest('hex');
  }

  private generateOptimizedPath(originalPath: string): string {
    const parsed = path.parse(originalPath);
    const extension = this.getExtensionForFormat(this.options.format);
    return path.join(
      parsed.dir,
      `${parsed.name}_optimized${extension}`
    );
  }

  private getExtensionForFormat(format: string): string {
    switch (format) {
      case 'jpeg': return '.jpg';
      case 'webp': return '.webp';
      case 'png':
      default: return '.png';
    }
  }

  async createProgressiveJPEG(imagePath: string): Promise<string> {
    // Simulate progressive JPEG creation
    const outputPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '_progressive.jpg');
    
    const buffer = await fs.readFile(imagePath);
    const optimized = await this.processImage(buffer);
    
    await fs.writeFile(outputPath, optimized);
    return outputPath;
  }

  async generateWebPVariant(imagePath: string): Promise<string> {
    // Simulate WebP conversion
    const outputPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    
    const buffer = await fs.readFile(imagePath);
    const webpBuffer = await this.processImage(buffer);
    
    await fs.writeFile(outputPath, webpBuffer);
    return outputPath;
  }

  async generateResponsiveVariants(imagePath: string): Promise<string[]> {
    const variants: string[] = [];
    const sizes = [
      { width: 1920, suffix: '_desktop' },
      { width: 768, suffix: '_tablet' },
      { width: 375, suffix: '_mobile' }
    ];

    for (const size of sizes) {
      const buffer = await fs.readFile(imagePath);
      const resized = await this.resizeImage(buffer, size.width);
      
      const parsed = path.parse(imagePath);
      const variantPath = path.join(
        parsed.dir,
        `${parsed.name}${size.suffix}${parsed.ext}`
      );
      
      await fs.writeFile(variantPath, resized);
      variants.push(variantPath);
    }

    return variants;
  }

  private async resizeImage(buffer: Buffer, maxWidth: number): Promise<Buffer> {
    // Simulate image resizing
    // In real implementation, use sharp or canvas API
    const scaleFactor = Math.min(1, maxWidth / 1920); // Assume original is 1920px
    const newSize = Math.floor(buffer.length * scaleFactor);
    
    const resized = Buffer.alloc(newSize);
    buffer.copy(resized, 0, 0, newSize);
    
    return resized;
  }

  getOptimizationStats(): any {
    const results = Array.from(this.cache.values());
    
    if (results.length === 0) {
      return {
        totalImages: 0,
        averageCompression: 0,
        totalSavings: 0,
        averageProcessingTime: 0
      };
    }

    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalOptimizedSize = results.reduce((sum, r) => sum + r.optimizedSize, 0);
    const averageProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;

    return {
      totalImages: results.length,
      averageCompression: (totalOriginalSize - totalOptimizedSize) / totalOriginalSize,
      totalSavings: totalOriginalSize - totalOptimizedSize,
      averageProcessingTime,
      cacheHits: this.cache.size
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  async cleanup(): Promise<void> {
    this.clearCache();
  }
}

export default ImageOptimizer;