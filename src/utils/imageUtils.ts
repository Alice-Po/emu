import { RGBColor, ImageDimensions, ImageMetadata, ImageStats } from '../types/ImageOptimizer.types';
import * as exifr from 'exifr';
import { Crop } from 'react-image-crop';
import * as faceapi from 'face-api.js';

/**
 * Convertit une taille en bytes en format lisible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Convertit une couleur hexadécimale en RGB
 */
export const hexToRgb = (hex: string): RGBColor => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {
    r: 0x9D,
    g: 0xFF,
    b: 0x20
  };
};

/**
 * Vérifie si l'objet metadata contient des données
 */
export const hasMetadata = (metadata: ImageMetadata): boolean => {
  return Object.values(metadata).some(value => value !== undefined);
};

/**
 * Récupère les dimensions d'une image
 */
export const getImageDimensions = (file: File | Blob): Promise<ImageDimensions> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Extrait les métadonnées EXIF d'une image
 */
export const extractMetadata = async (file: File): Promise<ImageMetadata> => {
  try {
    const exif = await exifr.parse(file, {
      pick: ['Make', 'Model', 'DateTimeOriginal', 'ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'latitude', 'longitude']
    });
    return {
      Make: exif?.Make,
      Model: exif?.Model,
      DateTimeOriginal: exif?.DateTimeOriginal,
      ExposureTime: exif?.ExposureTime,
      FNumber: exif?.FNumber,
      ISO: exif?.ISO,
      FocalLength: exif?.FocalLength,
      latitude: exif?.latitude,
      longitude: exif?.longitude
    };
  } catch (error) {
    console.error('Erreur lors de la lecture des métadonnées:', error);
    return {};
  }
};

/**
 * Applique un effet monochrome à une image
 */
export const applyMonochromeEffect = (imageData: ImageData, color: string): ImageData => {
  const data = imageData.data;
  const rgbColor = hexToRgb(color);

  for (let i = 0; i < data.length; i += 4) {
    // Convertir en niveau de gris
    const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    
    // Appliquer l'effet monochrome avec la couleur fluo choisie
    const mixRatio = 0.7;  // 70% gris, 30% couleur
    data[i] = Math.min(255, gray * mixRatio + (rgbColor.r * (1 - mixRatio)));     // Rouge
    data[i + 1] = Math.min(255, gray * mixRatio + (rgbColor.g * (1 - mixRatio))); // Vert
    data[i + 2] = Math.min(255, gray * mixRatio + (rgbColor.b * (1 - mixRatio))); // Bleu
    // Alpha reste inchangé
  }
  return imageData;
};

/**
 * Calcule le ratio de compression entre l'image originale et compressée
 */
export const calculateCompressionRatio = (originalStats: ImageStats, compressedStats: ImageStats): string => {
  if (!originalStats || !compressedStats) return '0%';
  const ratio = ((originalStats.size - compressedStats.size) / originalStats.size) * 100;
  return `${ratio.toFixed(1)}%`;
};

/**
 * Recadre une image selon les dimensions spécifiées
 */
export const getCroppedImg = async (
  image: HTMLImageElement,
  crop: Crop,
  quality: number
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
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
    crop.height * scaleY
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        resolve(blob);
      },
      'image/jpeg',
      quality / 100
    );
  });
};

/**
 * Floute les visages détectés dans une image
 */
export const blurFaces = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Promise<void> => {
  try {
    console.log('Début de la détection des visages...');
    const detections = await faceapi.detectAllFaces(
      canvas,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 })
    );

    console.log(`${detections.length} visage(s) détecté(s)`);

    detections.forEach((detection) => {
      const box = detection.box;
      const margin = Math.max(box.width, box.height) * 0.3;
      const blurArea = {
        x: Math.max(0, box.x - margin),
        y: Math.max(0, box.y - margin),
        width: Math.min(canvas.width - box.x, box.width + 2 * margin),
        height: Math.min(canvas.height - box.y, box.height + 2 * margin)
      };
      
      ctx.filter = `blur(20px)`;
      ctx.drawImage(
        canvas,
        blurArea.x, blurArea.y, blurArea.width, blurArea.height,
        blurArea.x, blurArea.y, blurArea.width, blurArea.height
      );
      ctx.filter = 'none';
    });
  } catch (error) {
    console.error('Erreur lors du floutage des visages:', error);
  }
};

/**
 * Traite une image avec les effets spécifiés (monochrome, floutage)
 */
export const processImage = async (
  file: File,
  currentColor: string,
  shouldApplyStyle: boolean,
  quality: number,
  applyBlur: boolean,
  modelsLoaded: boolean,
  canvasRef: React.RefObject<HTMLCanvasElement>
): Promise<Blob> => {
  console.log('processImage - Début du traitement:', {
    shouldApplyStyle,
    currentColor,
    fileSize: file.size,
    applyBlur
  });

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dessiner l'image originale
      ctx.drawImage(img, 0, 0);

      // Flouter les visages si activé
      if (applyBlur && modelsLoaded) {
        console.log('processImage - Application du floutage des visages');
        await blurFaces(canvas, ctx);
      }

      // Appliquer l'effet monochrome si activé
      if (shouldApplyStyle) {
        console.log('processImage - Application du filtre monochrome');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const processedImageData = applyMonochromeEffect(imageData, currentColor);
        ctx.putImageData(processedImageData, 0, 0);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          console.log('processImage - Fin du traitement:', {
            resultSize: blob.size,
            shouldApplyStyle,
            withFilter: shouldApplyStyle
          });
          resolve(blob);
        }
      }, 'image/jpeg', quality / 100);
    };
    img.src = URL.createObjectURL(file);
  });
}; 