import { Crop } from "react-image-crop";
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
 * Generates a simple hash of the image for caching purposes.
 * @param imageData The image data to generate hash from
 * @returns A string representing the image hash
 */
export const generateImageHash = (imageData: ImageData): string => {
  const step = Math.max(1, Math.floor(imageData.data.length / 1000));
  let hash = "";
  for (let i = 0; i < imageData.data.length; i += step) {
    hash += imageData.data[i].toString(16);
  }
  return hash;
};
