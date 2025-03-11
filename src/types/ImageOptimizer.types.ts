import { RgbColor } from "../hooks/useDithering";

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
  fileType?: string;
  initialQuality?: number;
  alwaysKeepResolution?: boolean;
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
 * Interface for dithering cache
 */
export interface DitheringCache {
  quantizer: any;
  imageHash: string | null;
  imageData?: ImageData | null;
  pointContainer?: any;
  lastOptions?: {
    colorCount: number;
    rotation?: number;
    applyBlur: boolean;
  };
}

/**
 * Interface for processing cache
 */
export interface ProcessingCache {
  pointContainer: any;
  imageData: ImageData | null;
  lastOptions: ProcessingOptions | null;
  paletteCache: Map<string, any>;
  quantizer: any;
  imageHash: string | null;
}

/**
 * Interface for dithering controls
 */
export type DitheringAlgorithm =
  | "FloydSteinberg"
  | "FalseFloydSteinberg"
  | "Stucki"
  | "Atkinson"
  | "Jarvis"
  | "Burkes"
  | "Sierra"
  | "TwoSierra"
  | "SierraLite";

export interface DitheringOptions {
  algorithm: DitheringAlgorithm;
  serpentine: boolean;
  colors: number;
  quality: "low" | "medium" | "high";
}

export interface DitheringControlsProps {
  applyDithering: boolean;
  onDitheringChange: (apply: boolean) => void;
  colorCount: number;
  onColorCountChange: (count: number) => void;
  currentPalette: RgbColor[];
}

/**
 * Interface for image processing options
 */
export interface ProcessingOptions {
  quality: number;
  maxWidth: number;
  applyDithering: boolean;
  applyBlur: boolean;
  rotation?: number;
  colorCount: number;
}

/**
 * Interface for progress state during processing
 */
export interface ProgressState {
  step: string;
  value: number;
}

export interface DitheringCache {
  quantizer: any;
  imageHash: string | null;
  imageData?: ImageData | null;
  pointContainer?: any;
  lastOptions?: {
    colorCount: number;
    rotation?: number;
    applyBlur: boolean;
  };
}

interface BlobOptions {
  quality: number;
  mimeType: string;
}
