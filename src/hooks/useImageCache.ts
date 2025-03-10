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
      console.log("=== CACHE DEBUG ===");
      console.log("Checking if reprocessing needed:", {
        currentOptions,
        cacheOptions: cache.lastOptions,
        fileChanged: !originalImage || file !== originalImage,
      });

      if (!cache.lastOptions) {
        console.log("No cached options, reprocessing needed");
        return true;
      }

      // If file has changed, we need to reprocess
      if (!originalImage || file !== originalImage) {
        console.log("File changed, reprocessing needed");
        return true;
      }

      // If compression options have changed
      if (
        currentOptions.maxWidth !== cache.lastOptions.maxWidth ||
        currentOptions.quality !== cache.lastOptions.quality
      ) {
        console.log("Compression options changed, reprocessing needed");
        return true;
      }

      // If dithering is toggled
      if (currentOptions.applyDithering !== cache.lastOptions.applyDithering) {
        console.log("Dithering toggle changed, reprocessing needed");
        return true;
      }

      // If dithering is enabled and color count has changed
      if (
        currentOptions.applyDithering &&
        currentOptions.colorCount !== cache.lastOptions.colorCount
      ) {
        console.log("Color count changed, reprocessing needed");
        return true;
      }

      // If rotation has changed
      if (currentOptions.rotation !== cache.lastOptions.rotation) {
        console.log("Rotation changed, reprocessing needed");
        return true;
      }

      // If blur effect has changed
      if (currentOptions.applyBlur !== cache.lastOptions.applyBlur) {
        console.log("Blur effect changed, reprocessing needed");
        return true;
      }

      console.log("No changes detected, using cache");
      console.log("=== END CACHE DEBUG ===");
      return false;
    },
    [],
  );

  /**
   * Updates the cache with new processing options
   */
  const updateCache = useCallback((options: ProcessingOptions) => {
    console.log("Updating cache with options:", options);
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
