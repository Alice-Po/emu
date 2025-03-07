import { useTranslation } from "react-i18next";
import { DitheringOptions } from "../types/ImageOptimizer.types";

/// <reference path="../types/rgbquant.d.ts" />

interface DitheringCache {
  quantizer: any;
  imageHash: string | null;
  imageData?: ImageData | null;
  pointContainer?: any;
  lastOptions?: {
    colorCount: number;
    rotation?: number;
    applyBlur: boolean;
  };
}

/**
 * Custom hook to handle dithering effect on images using RgbQuant.js.
 * Provides functionality for color quantization and dithering with various algorithms.
 * @returns Functions and utilities for applying dithering effect
 */
export const useDithering = () => {
  const { t } = useTranslation();

  /**
   * Generates a simple hash of the image for caching purposes.
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
   * Convertit ImageData en tableau de pixels RGB
   * @param imageData Les données de l'image à convertir
   * @returns Un tableau de pixels [r,g,b,r,g,b,...]
   */
  const imageDataToPixels = (imageData: ImageData): Uint8Array => {
    console.log("Converting ImageData to pixels array", {
      width: imageData.width,
      height: imageData.height,
      totalPixels: imageData.width * imageData.height,
    });

    const pixels = new Uint8Array(imageData.width * imageData.height * 3);
    let j = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      pixels[j] = imageData.data[i]; // R
      pixels[j + 1] = imageData.data[i + 1]; // G
      pixels[j + 2] = imageData.data[i + 2]; // B
      j += 3;
    }
    return pixels;
  };

  /**
   * Applies dithering effect to an image using RgbQuant color quantization.
   * @param imageData The image data to process
   * @param options The dithering options
   * @param cache Optional cache to store and reuse the quantizer
   * @param onProgress Optional callback to track processing progress
   * @returns New image data with the dithering effect applied
   */
  const applyDitheringEffect = async (
    imageData: ImageData,
    _options: DitheringOptions,
    cache?: DitheringCache,
    onProgress?: (step: string, value: number) => void,
  ): Promise<ImageData> => {
    try {
      console.log("=== DITHERING DEBUG ===");

      const RgbQuant = (await import("rgbquant")).default;

      let quantizer = cache?.quantizer;
      const currentHash = generateImageHash(imageData);

      // Create new quantizer if cache is invalid
      if (!quantizer || cache?.imageHash !== currentHash) {
        onProgress?.(t("dithering.steps.creatingPalette"), 0);
        console.log("Creating new quantizer with default options");

        // Utiliser les options par défaut de RgbQuant
        quantizer = new RgbQuant({
          colors: 16,
          method: 2,
          dithKern: "FloydSteinberg",
          dithSerp: true,
        });

        // Convertir l'image en format approprié et l'échantillonner
        const pixels = imageDataToPixels(imageData);
        quantizer.sample(pixels);
        onProgress?.(t("dithering.steps.creatingPalette"), 50);

        // Construire la palette
        quantizer.palette(true);
        onProgress?.(t("dithering.steps.creatingPalette"), 100);

        // Update cache if available
        if (cache) {
          cache.quantizer = quantizer;
          cache.imageHash = currentHash;
          console.log("Cache updated");
        }
      } else {
        console.log("Using cached quantizer");
        onProgress?.(t("dithering.steps.usingCache"), 100);
      }

      onProgress?.(t("dithering.steps.applying"), 0);
      console.log("Starting reduction");

      // Appliquer le dithering
      const pixels = imageDataToPixels(imageData);
      const reduced = quantizer.reduce(pixels);

      // Convertir le résultat en ImageData
      const newImageData = new ImageData(imageData.width, imageData.height);
      let j = 0;
      for (let i = 0; i < reduced.length; i += 3) {
        newImageData.data[j] = reduced[i]; // R
        newImageData.data[j + 1] = reduced[i + 1]; // G
        newImageData.data[j + 2] = reduced[i + 2]; // B
        newImageData.data[j + 3] = 255; // A
        j += 4;
      }

      onProgress?.(t("dithering.steps.applying"), 100);
      return newImageData;
    } catch (error) {
      console.error("Error in dithering process:", error);
      return imageData;
    }
  };

  return {
    applyDitheringEffect,
    generateImageHash,
  };
};
