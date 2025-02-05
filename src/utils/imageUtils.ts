import { RGBColor, ImageDimensions, ImageMetadata, ImageStats } from '../types/ImageOptimizer.types';
import * as exifr from 'exifr';
import { Crop } from 'react-image-crop';
import * as faceapi from 'face-api.js';
import { utils, image, buildPalette, applyPalette } from 'image-q';

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
 * Applique un effet de dithering à une image
 * @param imageData Les données de l'image à traiter
 * @param numColors Le nombre de couleurs à utiliser (entre 2 et 32)
 */
export const applyDitheringEffect = async (imageData: ImageData, numColors = 8): Promise<ImageData> => {
  // Vérifier que le nombre de couleurs est dans la plage valide
  const colors = Math.max(2, Math.min(32, numColors));

  // Créer un point container pour l'image source
  const pointContainer = utils.PointContainer.fromUint8Array(
    imageData.data,
    imageData.width,
    imageData.height
  );
  console.log("Point container créé", pointContainer);

  try {
    // Créer la palette
    const palette = await buildPalette([pointContainer], {
      colorDistanceFormula: 'euclidean',
      paletteQuantization: 'neuquant',
      colors: colors, // Utiliser le nombre de couleurs spécifié
      onProgress: (progress: number) => console.log('buildPalette', progress),
    });
    console.log("Palette créée", palette);

    if (!palette) {
      throw new Error('La création de la palette a échoué');
    }

    // Applique la palette à l'image avec dithering
    const outPointContainer = await applyPalette(pointContainer, palette, {
      colorDistanceFormula: 'euclidean',
      imageQuantization: 'floyd-steinberg', // Algorithme de dithering
      onProgress: (progress: number) => console.log('applyPalette', progress),
    });
    console.log("Dithering appliqué", outPointContainer);

    if (!outPointContainer) {
      throw new Error('L\'application de la palette a échoué');
    }

    // Convertir le résultat en ImageData
    const uint8array = outPointContainer.toUint8Array();
    const newImageData = new ImageData(
      new Uint8ClampedArray(uint8array),
      imageData.width,
      imageData.height
    );

    return newImageData;
  } catch (error) {
    console.error('Erreur lors de l\'application du dithering:', error);
    return imageData; // Retourner l'image originale en cas d'erreur
  }
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

interface ProcessingCache {
  pointContainer: any;
  imageData: ImageData | null;
  lastOptions: any;
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
  cache?: ProcessingCache
): Promise<Blob> => {
  console.log('processImage - Début du traitement:', {
    shouldApplyStyle,
    fileSize: file.size,
    applyBlur,
    colorCount,
    rotation,
    useCache: !!cache,
    cacheColorCount: cache?.lastOptions?.colorCount
  });

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Ajuster les dimensions du canvas pour la rotation
      if (rotation % 180 === 0) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = img.height;
        canvas.height = img.width;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Appliquer la rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      let currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Appliquer l'effet de dithering si activé
      if (shouldApplyStyle) {
        console.log('processImage - Application du filtre dithering');
        
        // Vérifier si le cache est valide et si le nombre de couleurs correspond
        const isCacheValid = cache?.imageData && 
                           cache?.pointContainer && 
                           cache.lastOptions && 
                           cache.lastOptions.colorCount === colorCount &&
                           cache.lastOptions.rotation === rotation &&
                           cache.lastOptions.applyBlur === applyBlur;
        
        if (isCacheValid && cache.imageData) {
          console.log('Utilisation du cache pour le dithering (colorCount:', colorCount, ')');
          currentImageData = cache.imageData;
        } else {
          console.log('Application d\'un nouveau dithering (colorCount:', colorCount, ')');
          currentImageData = await applyDitheringEffect(currentImageData, colorCount);
          
          // Ne pas mettre à jour le cache maintenant si on doit encore flouter les visages
          if (cache && !applyBlur) {
            cache.imageData = currentImageData;
            cache.pointContainer = utils.PointContainer.fromUint8Array(
              currentImageData.data,
              currentImageData.width,
              currentImageData.height
            );
            cache.lastOptions = { colorCount, rotation, applyBlur };
          }
        }
        
        // Appliquer l'image traitée
        ctx.putImageData(currentImageData, 0, 0);
      }

      // Flouter les visages si activé (après le dithering)
      if (applyBlur && modelsLoaded) {
        console.log('processImage - Application du floutage des visages');
        await blurFaces(canvas, ctx);

        // Si on a appliqué le floutage, on met à jour le cache avec l'état final
        if (cache && shouldApplyStyle) {
          currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          cache.imageData = currentImageData;
          cache.pointContainer = utils.PointContainer.fromUint8Array(
            currentImageData.data,
            currentImageData.width,
            currentImageData.height
          );
          cache.lastOptions = { colorCount, rotation, applyBlur };
        }
      }

      canvas.toBlob((blob) => {
        if (blob) {
          console.log('processImage - Fin du traitement:', {
            resultSize: blob.size,
            shouldApplyStyle,
            withFilter: shouldApplyStyle,
            colorCount,
            applyBlur
          });
          resolve(blob);
        }
      }, 'image/jpeg', quality / 100);
    };
    img.src = URL.createObjectURL(file);
  });
}; 