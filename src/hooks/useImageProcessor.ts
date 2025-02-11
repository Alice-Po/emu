import { useCallback, useRef, useState } from "react";
import {
  ImageStats,
  ProcessingOptions,
  ProgressState,
} from "../types/ImageOptimizer.types";
import { getImageDimensions } from "../utils/imageUtils";
import { useImageCache } from "./useImageCache";
import { useImageCompression } from "./useImageCompression";
import { useImageProcessing } from "./useImageProcessing";

/**
 * Custom hook for managing image processing state and operations
 * Handles image compression, effects application, and caching
 */
export const useImageProcessor = () => {
  // Loading and progress state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    step: "",
    value: 0,
  });

  // Image states
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);
  const [compressedStats, setCompressedStats] = useState<ImageStats | null>(
    null,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hooks for processing and caching
  const { processImageWithStyle } = useImageProcessing();
  const { cache, shouldReprocess, updateCache, clearCache } = useImageCache();
  const { compressImage } = useImageCompression();

  /**
   * Updates the progress state with a new step and value
   */
  const updateProgress = useCallback((step: string, value: number) => {
    setProgress({ step, value });
  }, []);

  /**
   * Converts a blob to a data URL and updates the compressed image state
   */
  const updateCompressedImage = useCallback(async (blob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setCompressedImage(reader.result as string);
      setLoading(false);
    };
    reader.readAsDataURL(blob);
  }, []);

  /**
   * Updates the compressed stats with the dimensions and size of a blob
   */
  const updateCompressedStats = useCallback(async (blob: Blob) => {
    const dimensions = await getImageDimensions(blob);
    setCompressedStats({
      size: blob.size,
      width: dimensions.width,
      height: dimensions.height,
    });
  }, []);

  /**
   * Main function to process an image with given options
   * Handles both cached and full processing paths
   */
  const processImage = useCallback(
    async (file: File, options: ProcessingOptions) => {
      console.log("Processing options:", options);
      if (!file) return;

      setLoading(true);
      updateProgress("Initialization...", 0);

      try {
        // Check if we can reuse the cache
        if (!shouldReprocess(options, file, originalImage)) {
          console.log("Using cache for processing");
          const processedBlob = await processImageWithStyle(
            file,
            options.applyDithering,
            options.quality,
            options.applyBlur,
            true,
            canvasRef,
            options.ditheringColorCount,
            options.rotation || 0,
            cache,
            updateProgress,
          );

          await Promise.all([
            updateCompressedStats(processedBlob),
            updateCompressedImage(processedBlob),
          ]);
          return;
        }

        // Full processing path when cache cannot be used
        console.log("Starting new full processing");
        const dimensions = await getImageDimensions(file);

        // Set original image stats
        setOriginalStats({
          size: file.size,
          width: dimensions.width,
          height: dimensions.height,
        });

        updateProgress("Compressing image...", 0);

        // Apply initial compression
        const compressedFile = await compressImage(file, {
          quality: options.quality,
          maxWidth: options.maxWidth,
        });

        updateProgress("Compressing image...", 50);

        // Update cache with new processing options
        updateCache(options);

        // Apply additional processing effects
        const processedBlob = await processImageWithStyle(
          compressedFile,
          options.applyDithering,
          options.quality,
          options.applyBlur,
          true,
          canvasRef,
          options.ditheringColorCount,
          options.rotation || 0,
          cache,
          updateProgress,
        );

        await Promise.all([
          updateCompressedStats(processedBlob),
          updateCompressedImage(processedBlob),
        ]);
      } catch (error) {
        console.error("Error during processing:", error);
        setLoading(false);
        updateProgress("", 0);
      }
    },
    [
      originalImage,
      processImageWithStyle,
      shouldReprocess,
      updateCache,
      cache,
      compressImage,
      updateProgress,
      updateCompressedStats,
      updateCompressedImage,
    ],
  );

  /**
   * Resets all state and clears the cache
   */
  const reset = useCallback(() => {
    setOriginalImage(null);
    setCompressedImage(null);
    setOriginalStats(null);
    setCompressedStats(null);
    setLoading(false);
    clearCache();
  }, [clearCache]);

  return {
    loading,
    progress,
    originalImage,
    compressedImage,
    originalStats,
    compressedStats,
    canvasRef,
    processImage,
    setOriginalImage,
    reset,
    clearCache,
  };
};
