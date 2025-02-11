/**
 * Interface for image statistics
 */
export interface ImageStats {
  size: number;
  width: number;
  height: number;
}

/**
 * Interface for image EXIF metadata
 */
export interface ImageMetadata {
  Make?: string;
  Model?: string;
  DateTimeOriginal?: string;
  ExposureTime?: number;
  FNumber?: number;
  FocalLength?: number;
  latitude?: number;
  longitude?: number;
}

/**
 * Interface for image dimensions
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Interface for compression options
 */
export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  quality: number;
}

/**
 * Interface for blur area
 */
export interface BlurArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Interface for palette cache
 */
export interface PaletteCache {
  imageHash: string; // A unique identifier for the image
  colorCount: number;
  palette: any; // The exact type depends on image-q
}

/**
 * Interface for dithering controls
 */
export interface DitheringControlsProps {
  /** Dithering activation state */
  applyDithering: boolean;
  /** Number of colors for dithering */
  ditheringColorCount: number;
  /** Callback called when dithering state changes */
  onDitheringChange: (value: boolean) => void;
  /** Callback called when dithering color count changes */
  onDitheringColorCountChange: (value: number) => void;
}
