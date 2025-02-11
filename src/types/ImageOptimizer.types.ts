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
 * Interface pour le cache de la palette
 */
export interface PaletteCache {
  imageHash: string; // Un identifiant unique pour l'image
  colorCount: number;
  palette: any; // Le type exact dépend de image-q
}

/**
 * Interface pour les contrôles de dithering
 */
export interface DitheringControlsProps {
  /** État d'activation du dithering */
  applyDithering: boolean;
  /** Nombre de couleurs pour le dithering */
  ditheringColorCount: number;
  /** Callback appelé lors du changement d'état du dithering */
  onDitheringChange: (value: boolean) => void;
  /** Callback appelé lors du changement du nombre de couleurs du dithering */
  onDitheringColorCountChange: (value: number) => void;
}
