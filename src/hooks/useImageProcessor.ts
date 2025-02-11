import { utils } from "image-q";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ImageStats,
  ProcessingOptions,
  ProgressState,
} from "../types/ImageOptimizer.types";
import { getImageDimensions } from "../utils/imageUtils";
import { useCanvasOperations } from "./useCanvasOperations";
import { useDithering } from "./useDithering";
import { useFaceBlur } from "./useFaceBlur";
import { useImageCache } from "./useImageCache";

/**
 * Hook to handle image processing
 * Uses useCanvasOperations for canvas manipulation
 */
export const useImageProcessor = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    step: "",
    value: 0,
  });
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);
  const [compressedStats, setCompressedStats] = useState<ImageStats | null>(
    null,
  );

  const { canvasRef, setupCanvas, createBlobFromCanvas } =
    useCanvasOperations();
  const { cache, shouldReprocess, updateCache, clearCache } = useImageCache();
  const { applyDitheringEffect } = useDithering();
  const { blurFaces } = useFaceBlur();

  const updateProgress = (step: string, value: number) => {
    setProgress({ step, value });
  };

  const getImageStats = async (file: File | Blob): Promise<ImageStats> => {
    const dimensions = await getImageDimensions(file);
    return {
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
    };
  };

  /**
   * Applies image effects (dithering and blur)
   */
  const applyImageEffects = async (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    imageData: ImageData,
    options: ProcessingOptions,
  ): Promise<ImageData> => {
    let currentImageData = imageData;

    // Apply dithering if enabled
    if (options.applyDithering) {
      updateProgress("Preparing dithering", 0);
      currentImageData = await applyDitheringEffect(
        currentImageData,
        options.ditheringColorCount,
        cache,
        updateProgress,
      );
      ctx.putImageData(currentImageData, 0, 0);
    }

    // Apply face blur if enabled
    if (options.applyBlur) {
      updateProgress("Detecting faces", 0);
      await blurFaces(canvas, ctx);
      updateProgress("Face blurring complete", 100);

      if (cache && options.applyDithering) {
        currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        cache.imageData = currentImageData;
        cache.pointContainer = utils.PointContainer.fromUint8Array(
          currentImageData.data,
          currentImageData.width,
          currentImageData.height,
        );
        cache.lastOptions = {
          colorCount: options.ditheringColorCount,
          rotation: options.rotation,
          applyBlur: options.applyBlur,
        };
      }
    }

    return currentImageData;
  };

  const processImage = async (file: File, options: ProcessingOptions) => {
    try {
      setLoading(true);
      updateProgress(t("processing.steps.starting"), 0);

      // Update original image stats
      const stats = await getImageStats(file);
      setOriginalStats(stats);

      // Check if we can reuse the cache
      if (!shouldReprocess(options, file, originalImage)) {
        updateProgress(t("processing.steps.usingCache"), 50);
        if (cache.imageData) {
          const canvas = canvasRef.current;
          if (!canvas) throw new Error("Canvas not initialized");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");

          canvas.width = cache.imageData.width;
          canvas.height = cache.imageData.height;
          ctx.putImageData(cache.imageData, 0, 0);

          const blob = await createBlobFromCanvas(canvas, options.quality);
          const compressedStats = await getImageStats(blob);
          setCompressedStats(compressedStats);
          setCompressedImage(URL.createObjectURL(blob));
          updateProgress(t("processing.steps.complete"), 100);
          return;
        }
      }

      // Create image and canvas
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not initialized");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Setup canvas and apply rotation
      const imageData = setupCanvas(canvas, ctx, img, options.rotation);

      // Apply effects (dithering and blur)
      await applyImageEffects(canvas, ctx, imageData, options);

      // Update cache with new options
      updateCache(options);

      // Create final blob
      updateProgress(t("processing.steps.finalizing"), 90);
      const blob = await createBlobFromCanvas(canvas, options.quality);
      const compressedStats = await getImageStats(blob);

      // Update states
      setCompressedStats(compressedStats);
      setCompressedImage(URL.createObjectURL(blob));
      updateProgress(t("processing.steps.complete"), 100);
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

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
    clearCache,
  };
};
