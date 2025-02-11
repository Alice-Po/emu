import imageCompression from "browser-image-compression";
import { useCallback, useRef, useState } from "react";
import { ImageMetadata, ImageStats } from "../types/ImageOptimizer.types";
import { extractMetadata, getImageDimensions } from "../utils/imageUtils";
import { useImageCache } from "./useImageCache";
import { useImageProcessing } from "./useImageProcessing";

/**
 * Interface defining the options for image processing
 */
interface ProcessingOptions {
  /** Quality level for compression (0-100) */
  quality: number;
  /** Maximum width for the processed image */
  maxWidth: number;
  /** Whether to apply dithering effect */
  applyDithering: boolean;
  /** Whether to apply face blur effect */
  applyBlur: boolean;
  /** Number of colors to use in dithering (2-32) */
  ditheringColorCount: number;
  /** Optional rotation angle in degrees */
  rotation?: number;
}

/**
 * Custom hook for managing image processing state and operations
 * Handles image compression, effects application, and caching
 */
export const useImageProcessor = () => {
  // Loading and progress state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{
    step: string;
    value: number;
  }>({
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
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hooks for processing and caching
  const { processImageWithStyle } = useImageProcessing();
  const { cache, shouldReprocess, updateCache, clearCache } = useImageCache();

  /**
   * Main function to process an image with given options
   * Handles both cached and full processing paths
   */
  const processImage = useCallback(
    async (file: File, options: ProcessingOptions) => {
      console.log("Processing options:", options);
      if (!file) return;

      setLoading(true);
      setProgress({
        step: "Initialization...",
        value: 0,
      });

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
            (step: string, value: number) => {
              setProgress({
                step,
                value,
              });
            },
          );

          // Update compressed stats
          const compressedDimensions = await getImageDimensions(processedBlob);
          setCompressedStats({
            size: processedBlob.size,
            width: compressedDimensions.width,
            height: compressedDimensions.height,
          });

          // Convert to data URL for display
          const reader = new FileReader();
          reader.onloadend = () => {
            setCompressedImage(reader.result as string);
            setLoading(false);
          };
          reader.readAsDataURL(processedBlob);
          return;
        }

        // Full processing path when cache cannot be used
        console.log("Starting new full processing");
        const [dimensions, imageMetadata] = await Promise.all([
          getImageDimensions(file),
          extractMetadata(file),
        ]);

        // Set original image metadata and stats
        setMetadata(imageMetadata);
        setOriginalStats({
          size: file.size,
          width: dimensions.width,
          height: dimensions.height,
        });

        // Configure and apply initial compression
        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: options.maxWidth,
          useWebWorker: true,
          quality: options.quality / 100,
        };

        const compressedFile = await imageCompression(file, compressionOptions);

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
          (step: string, value: number) => {
            setProgress({
              step,
              value,
            });
          },
        );

        // Update final stats and display
        const compressedDimensions = await getImageDimensions(processedBlob);
        setCompressedStats({
          size: processedBlob.size,
          width: compressedDimensions.width,
          height: compressedDimensions.height,
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          setCompressedImage(reader.result as string);
          setLoading(false);
        };
        reader.readAsDataURL(processedBlob);
      } catch (error) {
        console.error("Error during processing:", error);
        setLoading(false);
        setProgress({
          step: "",
          value: 0,
        });
      }
    },
    [originalImage, processImageWithStyle, shouldReprocess, updateCache, cache],
  );

  /**
   * Resets all state and clears the cache
   */
  const reset = useCallback(() => {
    setOriginalImage(null);
    setCompressedImage(null);
    setOriginalStats(null);
    setCompressedStats(null);
    setMetadata(null);
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
    metadata,
    canvasRef,
    processImage,
    setOriginalImage,
    reset,
    clearCache,
  };
};
