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
import { useImageCompression } from "./useImageCompression";
import { utils } from "face-api.js";
/**
 * Hook to handle image processing
 * Uses useCanvasOperations for canvas manipulation
 */
export const useImageProcessor = () => {
  const { t } = useTranslation();
  const { compressImage } = useImageCompression();

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
  const { applyDitheringEffect, currentPalette } = useDithering();
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
        options.colorCount || 16,
        cache,
        updateProgress,
      );

      // Vérifier que l'image est bien mise à jour sur le canvas
      ctx.putImageData(currentImageData, 0, 0);

      if (cache && options.applyDithering) {
        currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        cache.imageData = currentImageData;
        cache.pointContainer = utils.PointContainer.fromUint8Array(
          currentImageData.data,
          currentImageData.width,
          currentImageData.height,
        );
        cache.lastOptions = {
          colorCount: options.colorCount,
          rotation: options.rotation,
          applyBlur: options.applyBlur,
        };
      }
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
          colorCount: options.colorCount,
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

      // Check if we can reuse the cache
      //TODO : check simply shouldReprocess
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

          const blob = await createBlobFromCanvas(canvas, {
            quality: options.quality,
            mimeType: file.type,
          });
          const compressedStats = await getImageStats(blob);
          setCompressedStats(compressedStats);
          setCompressedImage(URL.createObjectURL(blob));
          updateProgress(t("processing.steps.complete"), 100);
          return;
        }
      }

      // Conserver le type MIME original
      const isPNG = file.type === "image/png";

      // Get original image stats
      const originalStats = await getImageStats(file);
      setOriginalStats(originalStats);

      // Compression initiale avec préservation du format PNG si nécessaire
      updateProgress(t("processing.steps.compression"), 0);
      const compressedFile = await compressImage(file, {
        quality: options.quality,
        maxWidth: options.maxWidth,
      });
      if (
        isPNG &&
        !options.applyDithering &&
        !options.applyBlur &&
        !options.rotation
      ) {
        const compressedStats = await getImageStats(compressedFile);
        setCompressedStats(compressedStats);
        setCompressedImage(URL.createObjectURL(compressedFile));
        updateProgress(t("processing.steps.complete"), 100);
        return;
      }
      // Create image and canvas
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not initialized");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const imageData = setupCanvas(canvas, ctx, img, options.rotation);

      await applyImageEffects(canvas, ctx, imageData, options);

      updateCache(options);

      updateProgress(t("processing.steps.finalizing"), 90);

      const blob = await createBlobFromCanvas(canvas, {
        quality: options.quality,
        mimeType: file.type,
      });

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
    currentPalette,
  };
};
