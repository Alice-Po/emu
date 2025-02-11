import { useCallback, useRef } from "react";

interface ProcessingOptions {
  quality: number;
  maxWidth: number;
  applyDithering: boolean;
  applyBlur: boolean;
  ditheringColorCount: number;
  rotation?: number;
}

interface ProcessingCache {
  pointContainer: any;
  imageData: ImageData | null;
  lastOptions: ProcessingOptions | null;
  paletteCache: Map<string, any>;
}

/**
 * Custom hook to manage image processing cache
 * Handles caching of processed images and their options to avoid unnecessary reprocessing
 */
export const useImageCache = () => {
  const processingCache = useRef<ProcessingCache>({
    pointContainer: null,
    imageData: null,
    lastOptions: null,
    paletteCache: new Map(),
  });

  /**
   * Determines if an image needs to be reprocessed based on current options
   */
  const shouldReprocess = useCallback(
    (
      currentOptions: ProcessingOptions,
      file: File,
      originalImage: File | null,
    ): boolean => {
      const cache = processingCache.current;
      if (!cache.lastOptions) return true;

      // If file has changed, we need to reprocess
      if (!originalImage || file !== originalImage) return true;

      // If compression options have changed
      if (
        currentOptions.maxWidth !== cache.lastOptions.maxWidth ||
        currentOptions.quality !== cache.lastOptions.quality
      )
        return true;

      // If dithering is toggled
      if (currentOptions.applyDithering !== cache.lastOptions.applyDithering)
        return true;

      // If dithering is enabled and options have changed
      if (
        currentOptions.applyDithering &&
        currentOptions.ditheringColorCount !==
          cache.lastOptions.ditheringColorCount
      )
        return true;

      // If rotation has changed
      if (currentOptions.rotation !== cache.lastOptions.rotation) return true;

      // If blur effect has changed
      if (currentOptions.applyBlur !== cache.lastOptions.applyBlur) return true;

      return false;
    },
    [],
  );

  /**
   * Updates the cache with new processing options
   */
  const updateCache = useCallback((options: ProcessingOptions) => {
    processingCache.current.lastOptions = { ...options };
  }, []);

  /**
   * Clears all cached data
   */
  const clearCache = useCallback(() => {
    processingCache.current = {
      pointContainer: null,
      imageData: null,
      lastOptions: null,
      paletteCache: new Map(),
    };
  }, []);

  return {
    cache: processingCache.current,
    shouldReprocess,
    updateCache,
    clearCache,
  };
};
