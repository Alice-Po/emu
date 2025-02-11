import { useState } from "react";
import { ImageMetadata } from "../types/ImageOptimizer.types";
import { extractMetadata } from "../utils/imageUtils";

/**
 * Vérifie si l'objet contient des métadonnées
 */
const hasMetadata = (metadata: ImageMetadata | null): boolean => {
  if (!metadata) return false;
  return !!(
    metadata.Make ||
    metadata.Model ||
    metadata.DateTimeOriginal ||
    metadata.ExposureTime ||
    metadata.FNumber ||
    metadata.FocalLength ||
    (metadata.latitude && metadata.longitude)
  );
};

/**
 * Hook to manage the extraction and storage of image metadata
 */
export const useImageMetadata = () => {
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);

  const processMetadata = async (file: File) => {
    try {
      const imageMetadata = await extractMetadata(file);
      setMetadata(imageMetadata);
      return imageMetadata;
    } catch (error) {
      console.error("Erreur lors de l'extraction des métadonnées:", error);
      setMetadata(null);
      return null;
    }
  };

  const clearMetadata = () => {
    setMetadata(null);
  };

  return {
    metadata,
    processMetadata,
    clearMetadata,
    hasMetadata: (meta: ImageMetadata | null) => hasMetadata(meta),
  };
};
