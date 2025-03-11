import * as exifr from "exifr";
import { useState } from "react";
import { ImageMetadata } from "../types/ImageOptimizer.types";

/**
 * Hook to manage the extraction and storage of image metadata
 */
export const useImageMetadata = () => {
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);

  /**
   * Extracts metadata from an image file
   * @param file The image file to extract metadata from
   * @returns Promise resolving to the extracted metadata
   */
  const extractMetadata = async (file: File): Promise<ImageMetadata> => {
    try {
      const exif = await exifr.parse(file, {
        pick: [
          "Make",
          "Model",
          "DateTimeOriginal",
          "ExposureTime",
          "FNumber",
          "FocalLength",
          "latitude",
          "longitude",
        ],
      });

      return {
        Make: exif?.Make,
        Model: exif?.Model,
        DateTimeOriginal: exif?.DateTimeOriginal,
        ExposureTime: exif?.ExposureTime,
        FNumber: exif?.FNumber,
        FocalLength: exif?.FocalLength,
        latitude: exif?.latitude,
        longitude: exif?.longitude,
      };
    } catch (error) {
      console.error("Error extracting metadata:", error);
      return {};
    }
  };

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

  const hasMetadata = (metadata: ImageMetadata): boolean => {
    return !!(
      metadata.Make ||
      metadata.Model ||
      metadata.DateTimeOriginal ||
      metadata.ExposureTime ||
      metadata.FNumber ||
      metadata.FocalLength ||
      metadata.latitude ||
      metadata.longitude
    );
  };

  return {
    metadata,
    processMetadata,
    clearMetadata,
    hasMetadata,
  };
};
