/**
 * Image Statistics Interface
 */
export interface ImageStats {
  size: number;
  width: number;
  height: number;
}

/**
 * EXIF Metadata Interface
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
 * Image Dimensions Interface
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Compression Options Interface
 */
export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  quality: number;
}

/**
 * Blur Area Interface
 */
export interface BlurArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Processing Options Interface
 */
export interface ProcessingOptions {
  /** Quality level for compression (0-100) */
  quality: number;
  /** Maximum width for the processed image */
  maxWidth: number;
  /** Whether to apply dithering effect */
  applyDithering: boolean;
  /** Whether to apply face blur effect */
  applyBlur: boolean;
  /** Number of colors to use in dithering (2-32) */
  ditheringColorCount: number;
  /** Optional rotation angle in degrees */
  rotation?: number;
}

/**
 * Processing Cache Interface
 */
export interface ProcessingCache {
  /** Container for image point data */
  pointContainer: any;
  /** Current image data being processed */
  imageData: ImageData | null;
  /** Last used processing options */
  lastOptions: ProcessingOptions | null;
  /** Cache for color palettes */
  paletteCache: Map<string, any>;
}

/**
 * Progress State Interface
 */
export interface ProgressState {
  /** Current processing step description */
  step: string;
  /** Progress value (0-100) */
  value: number;
}

/**
 * Dithering Controls Props Interface
 */
export interface DitheringControlsProps {
  /** Whether dithering is enabled */
  applyDithering: boolean;
  /** Number of colors for dithering */
  ditheringColorCount: number;
  /** Callback for dithering state change */
  onDitheringChange: (value: boolean) => void;
  /** Callback for color count change */
  onDitheringColorCountChange: (value: number) => void;
}

/**
 * Progress Callback Type
 */
export type ProgressCallback = (step: string, value: number) => void;
