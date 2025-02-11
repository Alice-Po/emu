import { utils } from "image-q";
import { RefObject } from "react";
import { useDithering } from "./useDithering";
import { useFaceBlur } from "./useFaceBlur";

/**
 * Interface for the processing cache
 * Stores intermediate results and options to optimize processing
 */
interface ProcessingCache {
  pointContainer: any;
  imageData: ImageData | null;
  lastOptions: any;
  paletteCache: Map<string, any>;
}

/**
 * Custom hook for handling image processing operations
 * Combines dithering and face blurring effects
 * @returns Functions and utilities for image processing
 */
export const useImageProcessing = () => {
  const { applyDitheringEffect } = useDithering();
  const { blurFaces } = useFaceBlur();

  /**
   * Processes an image with specified effects (dithering, face blurring)
   *
   * @param file The image file to process
   * @param shouldApplyStyle Whether to apply dithering effect
   * @param quality Compression quality (0-100)
   * @param applyBlur Whether to apply face blurring
   * @param modelsLoaded Whether face detection models are loaded
   * @param canvasRef Reference to the canvas element
   * @param colorCount Number of colors for dithering (2-32)
   * @param rotation Rotation angle in degrees
   * @param cache Optional cache for optimization
   * @param onProgress Callback for progress updates
   * @returns Promise resolving to the processed image blob
   */
  const processImageWithStyle = async (
    file: File,
    shouldApplyStyle: boolean,
    quality: number,
    applyBlur: boolean,
    modelsLoaded: boolean,
    canvasRef: RefObject<HTMLCanvasElement>,
    colorCount = 8,
    rotation = 0,
    cache?: ProcessingCache,
    onProgress?: (step: string, value: number) => void,
  ): Promise<Blob> => {
    console.log("Processing started:", {
      shouldApplyStyle,
      fileSize: file.size,
      applyBlur,
      colorCount,
      rotation,
      useCache: !!cache,
      cacheColorCount: cache?.lastOptions?.colorCount,
    });

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        // Step 1: Image preparation
        onProgress?.("Preparing image", 0);
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Canvas configuration and rotation
        if (rotation % 180 === 0) {
          canvas.width = img.width;
          canvas.height = img.height;
        } else {
          canvas.width = img.height;
          canvas.height = img.width;
        }
        onProgress?.("Preparing image", 50);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Apply rotation
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
        onProgress?.("Preparing image", 100);

        let currentImageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        // Step 2: Apply dithering if enabled
        if (shouldApplyStyle) {
          onProgress?.("Preparing dithering", 0);
          currentImageData = await applyDitheringEffect(
            currentImageData,
            colorCount,
            cache,
            onProgress,
          );
          ctx.putImageData(currentImageData, 0, 0);
        }

        // Step 3: Apply face blurring if enabled
        if (applyBlur && modelsLoaded) {
          onProgress?.("Detecting faces", 0);
          await blurFaces(canvas, ctx);
          onProgress?.("Face blurring complete", 100);

          if (cache && shouldApplyStyle) {
            currentImageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            cache.imageData = currentImageData;
            cache.pointContainer = utils.PointContainer.fromUint8Array(
              currentImageData.data,
              currentImageData.width,
              currentImageData.height,
            );
            cache.lastOptions = { colorCount, rotation, applyBlur };
          }
        }

        // Final step: Compression and finalization
        onProgress?.("Finalizing", 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log("Processing completed:", {
                resultSize: blob.size,
                shouldApplyStyle,
                withFilter: shouldApplyStyle,
                colorCount,
                applyBlur,
              });
              onProgress?.("Complete", 100);
              resolve(blob);
            }
          },
          "image/jpeg",
          quality / 100,
        );
      };
      img.src = URL.createObjectURL(file);
    });
  };

  return {
    processImageWithStyle,
  };
};
