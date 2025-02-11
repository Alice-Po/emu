import * as faceapi from "face-api.js";
import { utils } from "image-q";
import { Crop } from "react-image-crop";
import { useDithering } from "../hooks/useDithering";
import { ImageDimensions, ImageStats } from "../types/ImageOptimizer.types";

/**
 * Converts a size in bytes to a readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Gets the dimensions of an image
 */
export const getImageDimensions = (
  file: File | Blob,
): Promise<ImageDimensions> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculates the compression ratio between original and compressed image
 */
export const calculateCompressionRatio = (
  originalStats: ImageStats,
  compressedStats: ImageStats,
): string => {
  if (!originalStats || !compressedStats) return "0%";
  const ratio =
    ((originalStats.size - compressedStats.size) / originalStats.size) * 100;
  return `${ratio.toFixed(1)}%`;
};

/**
 * Crops an image according to specified dimensions
 */
export const getCroppedImg = async (
  image: HTMLImageElement,
  crop: Crop,
  quality: number,
): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY,
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error("Canvas is empty");
        }
        resolve(blob);
      },
      "image/jpeg",
      quality / 100,
    );
  });
};

/**
 * Floute les visages détectés dans une image
 */
export const blurFaces = async (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): Promise<void> => {
  try {
    console.log("Début de la détection des visages...");
    const detections = await faceapi.detectAllFaces(
      canvas,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }),
    );

    console.log(`${detections.length} visage(s) détecté(s)`);

    detections.forEach((detection) => {
      const box = detection.box;
      const margin = Math.max(box.width, box.height) * 0.3;
      const blurArea = {
        x: Math.max(0, box.x - margin),
        y: Math.max(0, box.y - margin),
        width: Math.min(canvas.width - box.x, box.width + 2 * margin),
        height: Math.min(canvas.height - box.y, box.height + 2 * margin),
      };

      ctx.filter = `blur(20px)`;
      ctx.drawImage(
        canvas,
        blurArea.x,
        blurArea.y,
        blurArea.width,
        blurArea.height,
        blurArea.x,
        blurArea.y,
        blurArea.width,
        blurArea.height,
      );
      ctx.filter = "none";
    });
  } catch (error) {
    console.error("Erreur lors du floutage des visages:", error);
  }
};

interface ProcessingCache {
  pointContainer: any;
  imageData: ImageData | null;
  lastOptions: any;
  paletteCache: Map<string, any>;
}

/**
 * Traite une image avec les effets spécifiés (dithering, floutage)
 */
export const processImageWhithStyle = async (
  file: File,
  shouldApplyStyle: boolean,
  quality: number,
  applyBlur: boolean,
  modelsLoaded: boolean,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  colorCount = 8,
  rotation = 0,
  cache?: ProcessingCache,
  onProgress?: (step: string, value: number) => void,
): Promise<Blob> => {
  console.log("processImage - Début du traitement:", {
    shouldApplyStyle,
    fileSize: file.size,
    applyBlur,
    colorCount,
    rotation,
    useCache: !!cache,
    cacheColorCount: cache?.lastOptions?.colorCount,
  });

  const { applyDitheringEffect } = useDithering();

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      // Étape 1: Préparation de l'image
      onProgress?.("Préparation de l'image", 0);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Configuration du canvas et rotation
      if (rotation % 180 === 0) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = img.height;
        canvas.height = img.width;
      }
      onProgress?.("Préparation de l'image", 50);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Appliquer la rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      onProgress?.("Préparation de l'image", 100);

      let currentImageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      // Étape 2: Dithering (si activé)
      if (shouldApplyStyle) {
        onProgress?.("Préparation du dithering", 0);
        currentImageData = await applyDitheringEffect(
          currentImageData,
          colorCount,
          cache,
          onProgress,
        );
        ctx.putImageData(currentImageData, 0, 0);
      }

      // Étape 3: Floutage des visages (si activé)
      if (applyBlur && modelsLoaded) {
        onProgress?.("Détection des visages", 0);
        await blurFaces(canvas, ctx);
        onProgress?.("Floutage des visages", 100);

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

      // Étape finale: Compression et finalisation
      onProgress?.("Finalisation", 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("processImage - Fin du traitement:", {
              resultSize: blob.size,
              shouldApplyStyle,
              withFilter: shouldApplyStyle,
              colorCount,
              applyBlur,
            });
            onProgress?.("Terminé", 100);
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
