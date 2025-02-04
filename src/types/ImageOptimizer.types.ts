import { WithFaceLandmarks, FaceDetection } from 'face-api.js';

/**
 * Interface pour les statistiques d'une image
 */
export interface ImageStats {
  size: number;
  width: number;
  height: number;
}

/**
 * Interface pour les métadonnées EXIF d'une image
 */
export interface ImageMetadata {
  Make?: string;
  Model?: string;
  DateTimeOriginal?: string;
  ExposureTime?: number;
  FNumber?: number;
  ISO?: number;
  FocalLength?: number;
  latitude?: number;
  longitude?: number;
}

/**
 * Type pour la détection de visage avec face-api.js
 */
export type FaceDetectionWithLandmarks = WithFaceLandmarks<{ detection: FaceDetection }>;

/**
 * Interface pour les dimensions d'une image
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Interface pour les options de compression
 */
export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  quality: number;
}

/**
 * Interface pour la zone de floutage
 */
export interface BlurArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Interface pour la couleur RGB
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
} 