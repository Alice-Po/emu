import { useTranslation } from "react-i18next";
import { useState } from "react";
import { generateImageHash } from "../utils/imageUtils";
import { RgbColor, DitheringCache } from "../types/ImageOptimizer.types";

/**
 * Custom hook to handle dithering effect on images using RgbQuant.js.
 * Provides functionality for color quantization and dithering with various algorithms.
 * @returns Functions and utilities for applying dithering effect
 */
export const useDithering = () => {
  const { t } = useTranslation();

  const [currentPalette, setCurrentPalette] = useState<RgbColor[]>([]);

  /**
   * Applies dithering effect to an image using RgbQuant color quantization.
   * @param imageData The image data to process
   * @param colorCount The number of colors to use for quantization
   * @param cache Optional cache to store and reuse the quantizer
   * @param onProgress Optional callback to track processing progress
   * @returns New image data with the dithering effect applied
   */
  const applyDitheringEffect = async (
    imageData: ImageData,
    colorCount = 16,
    cache?: DitheringCache,
    onProgress?: (step: string, value: number) => void,
  ): Promise<ImageData> => {
    try {
      // Analyse des pixels transparents dans l'image originale
      const transparentPixelsOriginal = [];
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i + 3] < 128) {
          // Alpha < 128 considéré comme transparent
          transparentPixelsOriginal.push({
            index: i / 4,
            rgba: [
              imageData.data[i],
              imageData.data[i + 1],
              imageData.data[i + 2],
              imageData.data[i + 3],
            ],
          });
        }
      }

      // 1. Créer une carte de transparence
      const transparencyMap = new Uint8Array(
        imageData.width * imageData.height,
      );
      for (let i = 0; i < imageData.data.length; i += 4) {
        transparencyMap[i / 4] = imageData.data[i + 3];
      }

      const RgbQuant = (await import("rgbquant")).default;

      let quantizer = cache?.quantizer;
      const currentHash = generateImageHash(imageData);

      // Create new quantizer if cache is invalid or if color count has changed
      if (
        !quantizer ||
        cache?.imageHash !== currentHash ||
        cache?.lastOptions?.colorCount !== colorCount
      ) {
        onProgress?.(t("dithering.steps.creatingPalette"), 0);
        // Utiliser les options par défaut de RgbQuant avec le nombre de couleurs personnalisé
        quantizer = new RgbQuant({
          colors: colorCount,
          method: 2,
          dithKern: "FloydSteinberg",
          dithSerp: true,
        });

        quantizer.sample(imageData.data);
        onProgress?.(t("dithering.steps.creatingPalette"), 50);

        // Construire la palette
        const palette = quantizer.palette(true);

        // Convertir la palette en format RGB a vérifier l'utiliser plus tard
        const rgbPalette = palette.map((color: number[]) => ({
          r: color[0],
          g: color[1],
          b: color[2],
        }));
        setCurrentPalette(rgbPalette);

        onProgress?.(t("dithering.steps.creatingPalette"), 100);

        // Update cache if available
        if (cache) {
          cache.quantizer = quantizer;
          cache.imageHash = currentHash;
          cache.lastOptions = {
            colorCount,
            rotation: cache.lastOptions?.rotation,
            applyBlur: cache.lastOptions?.applyBlur || false,
          };
        }
      } else {
        onProgress?.(t("dithering.steps.usingCache"), 100);
      }

      onProgress?.(t("dithering.steps.applying"), 0);

      // Appliquer le dithering
      const reduced = quantizer.reduce(imageData.data, 1, "FloydSteinberg");
      if (!reduced) {
        console.error("Reduction failed - reduced is undefined");
        throw new Error("Reduction failed");
      }

      // Analyse des pixels transparents dans l'image réduite
      const transparentPixelsReduced = [];
      for (let i = 0; i < reduced.length; i += 4) {
        if (reduced[i + 3] < 128) {
          transparentPixelsReduced.push({
            index: i / 4,
            rgba: [reduced[i], reduced[i + 1], reduced[i + 2], reduced[i + 3]],
          });
        }
      }

      // Vérifier si les positions des pixels transparents sont préservées
      const preservedTransparency = transparentPixelsOriginal.every(
        (original) => reduced[original.index * 4 + 3] < 128,
      );

      const newImageData = new ImageData(imageData.width, imageData.height);
      for (let i = 0, j = 0; i < reduced.length; i += 4, j++) {
        newImageData.data[i] = reduced[i]; // R
        newImageData.data[i + 1] = reduced[i + 1]; // G
        newImageData.data[i + 2] = reduced[i + 2]; // B
        newImageData.data[i + 3] = transparencyMap[j]; // Alpha original
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
    currentPalette,
  };
};
