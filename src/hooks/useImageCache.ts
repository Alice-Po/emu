import { useCallback, useRef } from "react";
import {
  ProcessingCache,
  ProcessingOptions,
} from "../types/ImageOptimizer.types";

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
    quantizer: null,
    imageHash: null,
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

      if (!cache.lastOptions) {
        return true;
      }

      // If file has changed, we need to reprocess
      if (!originalImage || file !== originalImage) {
        return true;
      }

      // If compression options have changed
      if (
        currentOptions.maxWidth !== cache.lastOptions.maxWidth ||
        currentOptions.quality !== cache.lastOptions.quality
      ) {
        return true;
      }

      // If dithering is toggled
      if (currentOptions.applyDithering !== cache.lastOptions.applyDithering) {
        return true;
      }

      // If dithering is enabled and color count has changed
      if (
        currentOptions.applyDithering &&
        currentOptions.colorCount !== cache.lastOptions.colorCount
      ) {
        return true;
      }

      // If rotation has changed
      if (currentOptions.rotation !== cache.lastOptions.rotation) {
        return true;
      }

      // If blur effect has changed
      if (currentOptions.applyBlur !== cache.lastOptions.applyBlur) {
        return true;
      }
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
    console.log("Clearing cache");
    processingCache.current = {
      pointContainer: null,
      imageData: null,
      lastOptions: null,
      paletteCache: new Map(),
      quantizer: null,
      imageHash: null,
    };
  }, []);

  return {
    cache: processingCache.current,
    shouldReprocess,
    updateCache,
    clearCache,
  };
};
