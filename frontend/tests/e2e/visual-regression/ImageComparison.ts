import { promises as fs } from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

export interface ComparisonResult {
  screenshotId: string;
  hasDifferences: boolean;
  differencePercentage: number;
  pixelDifferences: number;
  totalPixels: number;
  diffImagePath?: string;
  affectedRegions: Region[];
  threshold: number;
  comparisonTime: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  pixelCount: number;
}

export interface ComparisonOptions {
  threshold: number;
  includeAA: boolean;
  alpha: number;
  aaColor: [number, number, number];
  diffColor: [number, number, number];
  diffColorAlt?: [number, number, number];
  createDiffImage: boolean;
  ignoreRegions?: Region[];
  maskColor?: [number, number, number];
}

export class ImageComparison {
  private defaultOptions: ComparisonOptions;

  constructor() {
    this.defaultOptions = {
      threshold: 0.1,
      includeAA: false,
      alpha: 0.1,
      aaColor: [255, 255, 0], // Yellow for anti-aliasing differences
      diffColor: [255, 0, 0], // Red for pixel differences
      diffColorAlt: [0, 255, 0], // Green for alternative diff highlighting
      createDiffImage: true,
      maskColor: [128, 128, 128] // Gray for masked regions
    };
  }

  /**
   * Compare two images and return detailed comparison result
   */
  async compare(
    currentImagePath: string,
    baselineImagePath: string,
    threshold: number = 0.1,
    options: Partial<ComparisonOptions> = {}
  ): Promise<ComparisonResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, threshold, ...options };

    try {
      // Load images with retry logic
      const [currentImage, baselineImage] = await this.loadImagesWithRetry(
        currentImagePath,
        baselineImagePath
      );

      // Validate image dimensions
      this.validateImageDimensions(currentImage, baselineImage);

      // Apply ignore regions if specified
      if (mergedOptions.ignoreRegions && mergedOptions.ignoreRegions.length > 0) {
        this.maskRegions(currentImage, mergedOptions.ignoreRegions, mergedOptions.maskColor!);
        this.maskRegions(baselineImage, mergedOptions.ignoreRegions, mergedOptions.maskColor!);
      }

      // Create diff image buffer
      const { width, height } = currentImage;
      const diffImage = new PNG({ width, height });

      // Perform pixel comparison with fallback
      const pixelDifferences = await this.performPixelComparisonWithFallback(
        currentImage,
        baselineImage,
        diffImage,
        width,
        height,
        mergedOptions
      );

      const totalPixels = width * height;
      const differencePercentage = (pixelDifferences / totalPixels) * 100;
      const hasDifferences = differencePercentage > threshold;

      // Generate diff image path
      let diffImagePath: string | undefined;
      if (mergedOptions.createDiffImage && hasDifferences) {
        diffImagePath = await this.saveDiffImageWithRetry(currentImagePath, diffImage);
      }

      // Detect affected regions
      const affectedRegions = this.detectAffectedRegions(diffImage.data, width, height);

      const comparisonTime = Date.now() - startTime;

      return {
        screenshotId: path.basename(currentImagePath, path.extname(currentImagePath)),
        hasDifferences,
        differencePercentage,
        pixelDifferences,
        totalPixels,
        diffImagePath,
        affectedRegions,
        threshold,
        comparisonTime
      };

    } catch (error) {
      throw new Error(`Image comparison failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Batch compare multiple image pairs
   */
  async batchCompare(
    comparisons: Array<{
      current: string;
      baseline: string;
      threshold?: number;
      options?: Partial<ComparisonOptions>;
    }>
  ): Promise<ComparisonResult[]> {
    const results: ComparisonResult[] = [];

    // Process comparisons in parallel with concurrency limit
    const concurrencyLimit = 4;
    const chunks = this.chunkArray(comparisons, concurrencyLimit);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(comparison =>
          this.compare(
            comparison.current,
            comparison.baseline,
            comparison.threshold,
            comparison.options
          ).catch(error => ({
            screenshotId: path.basename(comparison.current, path.extname(comparison.current)),
            hasDifferences: true,
            differencePercentage: 100,
            pixelDifferences: 0,
            totalPixels: 0,
            affectedRegions: [],
            threshold: comparison.threshold || 0.1,
            comparisonTime: 0,
            error: error.message
          } as ComparisonResult))
        )
      );

      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Load PNG image from file path
   */
  private async loadImage(imagePath: string): Promise<PNG> {
    try {
      const buffer = await fs.readFile(imagePath);
      return PNG.sync.read(buffer);
    } catch (error) {
      throw new Error(`Failed to load image ${imagePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate that images have the same dimensions
   */
  private validateImageDimensions(image1: PNG, image2: PNG): void {
    if (image1.width !== image2.width || image1.height !== image2.height) {
      throw new Error(
        `Image dimensions mismatch: ${image1.width}x${image1.height} vs ${image2.width}x${image2.height}`
      );
    }
  }

  /**
   * Mask specified regions in the image
   */
  private maskRegions(image: PNG, regions: Region[], maskColor: [number, number, number]): void {
    const [r, g, b] = maskColor;

    for (const region of regions) {
      for (let y = region.y; y < region.y + region.height && y < image.height; y++) {
        for (let x = region.x; x < region.x + region.width && x < image.width; x++) {
          const idx = (image.width * y + x) << 2;
          image.data[idx] = r;     // Red
          image.data[idx + 1] = g; // Green
          image.data[idx + 2] = b; // Blue
          // Keep alpha unchanged
        }
      }
    }
  }

  /**
   * Save diff image to file system
   */
  private async saveDiffImage(originalImagePath: string, diffImage: PNG): Promise<string> {
    const dir = path.dirname(originalImagePath);
    const name = path.basename(originalImagePath, path.extname(originalImagePath));
    const diffImagePath = path.join(dir, `${name}-diff.png`);

    const buffer = PNG.sync.write(diffImage);
    await fs.writeFile(diffImagePath, buffer);

    return diffImagePath;
  }

  /**
   * Detect regions with significant differences
   */
  private detectAffectedRegions(diffData: Buffer, width: number, height: number): Region[] {
    const regions: Region[] = [];
    const visited = new Set<string>();
    const minRegionSize = 10; // Minimum pixels to consider a region

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        if (visited.has(key)) continue;

        const idx = (width * y + x) << 2;
        const r = diffData[idx];
        const g = diffData[idx + 1];
        const b = diffData[idx + 2];

        // Check if pixel has differences (non-zero RGB values)
        if (r > 0 || g > 0 || b > 0) {
          const region = this.floodFillRegion(diffData, width, height, x, y, visited);
          
          if (region.pixelCount >= minRegionSize) {
            regions.push(region);
          }
        }
      }
    }

    return regions;
  }

  /**
   * Flood fill algorithm to detect connected regions of differences
   */
  private floodFillRegion(
    diffData: Buffer,
    width: number,
    height: number,
    startX: number,
    startY: number,
    visited: Set<string>
  ): Region {
    const stack: Array<[number, number]> = [[startX, startY]];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    let pixelCount = 0;

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) {
        continue;
      }

      const idx = (width * y + x) << 2;
      const r = diffData[idx];
      const g = diffData[idx + 1];
      const b = diffData[idx + 2];

      // Skip if no differences at this pixel
      if (r === 0 && g === 0 && b === 0) {
        continue;
      }

      visited.add(key);
      pixelCount++;

      // Update bounding box
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // Add neighboring pixels to stack
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      pixelCount
    };
  }

  /**
   * Load images with retry logic
   */
  private async loadImagesWithRetry(
    currentImagePath: string,
    baselineImagePath: string,
    maxRetries: number = 3
  ): Promise<[PNG, PNG]> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await Promise.all([
          this.loadImage(currentImagePath),
          this.loadImage(baselineImagePath)
        ]);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Image loading attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Failed to load images after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Perform pixel comparison with fallback algorithms
   */
  private async performPixelComparisonWithFallback(
    currentImage: PNG,
    baselineImage: PNG,
    diffImage: PNG,
    width: number,
    height: number,
    options: ComparisonOptions
  ): Promise<number> {
    try {
      // Primary method: Use pixelmatch
      const { default: pixelmatch } = await import('pixelmatch');
      return pixelmatch(
        currentImage.data,
        baselineImage.data,
        diffImage.data,
        width,
        height,
        {
          threshold: options.threshold,
          includeAA: options.includeAA,
          alpha: options.alpha,
          aaColor: options.aaColor,
          diffColor: options.diffColor,
          diffColorAlt: options.diffColorAlt
        }
      );
    } catch (error) {
      console.warn('Primary pixel comparison failed, using fallback:', error);
      
      // Fallback method: Simple pixel-by-pixel comparison
      return this.simplePixelComparison(
        currentImage.data,
        baselineImage.data,
        diffImage.data,
        width,
        height,
        options.threshold
      );
    }
  }

  /**
   * Simple pixel comparison fallback
   */
  private simplePixelComparison(
    img1: Buffer,
    img2: Buffer,
    diff: Buffer,
    width: number,
    height: number,
    threshold: number
  ): number {
    let pixelDifferences = 0;
    const thresholdValue = threshold * 255;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        
        const r1 = img1[idx];
        const g1 = img1[idx + 1];
        const b1 = img1[idx + 2];
        
        const r2 = img2[idx];
        const g2 = img2[idx + 1];
        const b2 = img2[idx + 2];
        
        const deltaR = Math.abs(r1 - r2);
        const deltaG = Math.abs(g1 - g2);
        const deltaB = Math.abs(b1 - b2);
        
        const maxDelta = Math.max(deltaR, deltaG, deltaB);
        
        if (maxDelta > thresholdValue) {
          pixelDifferences++;
          
          // Mark as different in diff image
          diff[idx] = 255;     // Red
          diff[idx + 1] = 0;   // Green
          diff[idx + 2] = 0;   // Blue
          diff[idx + 3] = 255; // Alpha
        } else {
          // Mark as same in diff image
          diff[idx] = r1;
          diff[idx + 1] = g1;
          diff[idx + 2] = b1;
          diff[idx + 3] = 255;
        }
      }
    }
    
    return pixelDifferences;
  }

  /**
   * Save diff image with retry logic
   */
  private async saveDiffImageWithRetry(
    originalImagePath: string,
    diffImage: PNG,
    maxRetries: number = 3
  ): Promise<string> {
    const dir = path.dirname(originalImagePath);
    const name = path.basename(originalImagePath, path.extname(originalImagePath));
    const diffImagePath = path.join(dir, `${name}-diff.png`);

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const buffer = PNG.sync.write(diffImage);
        await fs.writeFile(diffImagePath, buffer);
        return diffImagePath;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Diff image save attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = 500 * attempt; // Linear backoff for file operations
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Failed to save diff image after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Utility function to chunk array for batch processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Generate comparison report
   */
  generateComparisonReport(results: ComparisonResult[]): ComparisonReport {
    const totalComparisons = results.length;
    const failedComparisons = results.filter(r => r.hasDifferences).length;
    const passedComparisons = totalComparisons - failedComparisons;
    
    const averageDifference = results.reduce((sum, r) => sum + r.differencePercentage, 0) / totalComparisons;
    const maxDifference = Math.max(...results.map(r => r.differencePercentage));
    const totalComparisonTime = results.reduce((sum, r) => sum + r.comparisonTime, 0);

    const significantDifferences = results.filter(r => r.differencePercentage > 5);
    const minorDifferences = results.filter(r => r.hasDifferences && r.differencePercentage <= 5);

    return {
      summary: {
        totalComparisons,
        passedComparisons,
        failedComparisons,
        averageDifference,
        maxDifference,
        totalComparisonTime
      },
      categories: {
        significantDifferences: significantDifferences.length,
        minorDifferences: minorDifferences.length,
        noDifferences: passedComparisons
      },
      results
    };
  }
}

export interface ComparisonReport {
  summary: {
    totalComparisons: number;
    passedComparisons: number;
    failedComparisons: number;
    averageDifference: number;
    maxDifference: number;
    totalComparisonTime: number;
  };
  categories: {
    significantDifferences: number;
    minorDifferences: number;
    noDifferences: number;
  };
  results: ComparisonResult[];
}