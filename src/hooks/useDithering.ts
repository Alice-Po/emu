import { applyPalette, buildPalette, utils } from "image-q";
import { useTranslation } from "react-i18next";

interface DitheringCache {
  paletteCache: Map<string, any>;
}

/**
 * Custom hook to handle dithering effect on images.
 * Provides functionality for color reduction and dithering using the Floyd-Steinberg algorithm.
 * @returns Functions and utilities for applying dithering effect
 */
export const useDithering = () => {
  const { t } = useTranslation();

  /**
   * Generates a simple hash of the image for caching purposes.
   * This hash is used as a key to store and retrieve color palettes from the cache.
   * @param imageData The image data to generate hash from
   * @returns A string representing the image hash
   */
  const generateImageHash = (imageData: ImageData): string => {
    const step = Math.max(1, Math.floor(imageData.data.length / 1000));
    let hash = "";
    for (let i = 0; i < imageData.data.length; i += step) {
      hash += imageData.data[i].toString(16);
    }
    return hash;
  };

  /**
   * Applies dithering effect to an image using color quantization and Floyd-Steinberg dithering.
   * The function can use a cached palette if available to improve performance.
   *
   * @param imageData The image data to process
   * @param numColors Number of colors to use in the reduced palette (between 2 and 32)
   * @param cache Optional cache to store and retrieve color palettes
   * @param onProgress Optional callback to track processing progress
   * @returns New image data with the dithering effect applied
   */
  const applyDitheringEffect = async (
    imageData: ImageData,
    numColors = 32,
    cache?: DitheringCache,
    onProgress?: (step: string, value: number) => void,
  ): Promise<ImageData> => {
    // Verify that the number of colors is in the valid range
    const colors = Math.max(2, Math.min(32, numColors));

    // Create a point container for the source image
    const pointContainer = utils.PointContainer.fromUint8Array(
      imageData.data,
      imageData.width,
      imageData.height,
    );

    try {
      let palette;

      // Check if a palette exists in the cache
      if (cache?.paletteCache) {
        const imageHash = generateImageHash(imageData);
        const cacheKey = `${imageHash}-${colors}`;
        palette = cache.paletteCache.get(cacheKey);

        if (palette) {
          onProgress?.(t("dithering.steps.usingCache"), 100);
        }
      }

      // Create a new palette if necessary
      if (!palette) {
        onProgress?.(t("dithering.steps.creatingPalette"), 0);
        palette = await buildPalette([pointContainer], {
          colorDistanceFormula: "euclidean",
          paletteQuantization: "neuquant",
          colors: colors,
          onProgress: (progress: number) => {
            onProgress?.(t("dithering.steps.creatingPalette"), progress);
          },
        });

        // Cache the new palette
        if (cache?.paletteCache && palette) {
          const imageHash = generateImageHash(imageData);
          const cacheKey = `${imageHash}-${colors}`;
          cache.paletteCache.set(cacheKey, palette);
        }
      }

      if (!palette) {
        throw new Error("Palette creation failed");
      }

      // Apply the palette to the image with dithering
      onProgress?.(t("dithering.steps.applying"), 0);
      const outPointContainer = await applyPalette(pointContainer, palette, {
        colorDistanceFormula: "euclidean",
        imageQuantization: "floyd-steinberg",
        onProgress: (progress: number) => {
          onProgress?.(t("dithering.steps.applying"), progress);
        },
      });

      if (!outPointContainer) {
        throw new Error("Palette application failed");
      }

      // Convert the result to ImageData
      const uint8array = outPointContainer.toUint8Array();
      return new ImageData(
        new Uint8ClampedArray(uint8array),
        imageData.width,
        imageData.height,
      );
    } catch (error) {
      console.error("Error applying dithering:", error);
      return imageData; // Return original image in case of error
    }
  };

  return {
    applyDitheringEffect,
    generateImageHash,
  };
};
