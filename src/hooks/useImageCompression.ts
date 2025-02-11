import imageCompression from "browser-image-compression";
import { useCallback } from "react";
import { CompressionOptions } from "../types/ImageOptimizer.types";

/**
 * Hook for handling image compression operations
 * Provides a reusable way to compress images with configurable options
 */
export const useImageCompression = () => {
  /**
   * Compresses an image file according to specified options
   * @param file The image file to compress
   * @param options Compression options (quality, maxWidth)
   * @returns Promise resolving to the compressed file
   */
  const compressImage = useCallback(
    async (
      file: File,
      options: {
        quality: number;
        maxWidth: number;
      },
    ) => {
      const compressionOptions: CompressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: options.maxWidth,
        useWebWorker: true,
        quality: options.quality / 100,
      };

      try {
        const compressedFile = await imageCompression(file, compressionOptions);
        return compressedFile;
      } catch (error) {
        console.error("Error during image compression:", error);
        throw error;
      }
    },
    [],
  );

  return {
    compressImage,
  };
};
