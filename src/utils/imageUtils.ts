import * as exifr from "exifr";
import * as faceapi from "face-api.js";
import { applyPalette, buildPalette, utils } from "image-q";
import { Crop } from "react-image-crop";
import {
  ImageDimensions,
  ImageMetadata,
  ImageStats,
} from "../types/ImageOptimizer.types";

/**
 * Convertit une taille en bytes en format lisible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Vérifie si l'objet metadata contient des données
 */
export const hasMetadata = (metadata: ImageMetadata): boolean => {
  return Object.values(metadata).some((value) => value !== undefined);
};

/**
 * Récupère les dimensions d'une image
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
 * Extrait les métadonnées EXIF d'une image
 */
export const extractMetadata = async (file: File): Promise<ImageMetadata> => {
  try {
    const exif = await exifr.parse(file, {
      pick: [
        "Make",
        "Model",
        "DateTimeOriginal",
        "ExposureTime",
        "FNumber",
        "ISO",
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
      ISO: exif?.ISO,
      FocalLength: exif?.FocalLength,
      latitude: exif?.latitude,
      longitude: exif?.longitude,
    };
  } catch (error) {
    console.error("Erreur lors de la lecture des métadonnées:", error);
    return {};
  }
};

/**
 * Applique un effet de dithering à une image
 * @param imageData Les données de l'image à traiter
 * @param numColors Le nombre de couleurs à utiliser (entre 2 et 32)
 */
export const applyDitheringEffect = async (
  imageData: ImageData,
  numColors = 8,
): Promise<ImageData> => {
  // Vérifier que le nombre de couleurs est dans la plage valide
  const colors = Math.max(2, Math.min(32, numColors));

  // Créer un point container pour l'image source
  const pointContainer = utils.PointContainer.fromUint8Array(
    imageData.data,
    imageData.width,
    imageData.height,
  );
  console.log("Point container créé", pointContainer);

  try {
    // Créer la palette
    const palette = await buildPalette([pointContainer], {
      colorDistanceFormula: "euclidean",
      paletteQuantization: "neuquant",
      colors: colors, // Utiliser le nombre de couleurs spécifié
      onProgress: (progress: number) => console.log("buildPalette", progress),
    });
    console.log("Palette créée", palette);

    if (!palette) {
      throw new Error("La création de la palette a échoué");
    }

    // Applique la palette à l'image avec dithering
    const outPointContainer = await applyPalette(pointContainer, palette, {
      colorDistanceFormula: "euclidean",
      imageQuantization: "floyd-steinberg", // Algorithme de dithering
      onProgress: (progress: number) => console.log("applyPalette", progress),
    });
    console.log("Dithering appliqué", outPointContainer);

    if (!outPointContainer) {
      throw new Error("L'application de la palette a échoué");
    }

    // Convertir le résultat en ImageData
    const uint8array = outPointContainer.toUint8Array();
    const newImageData = new ImageData(
      new Uint8ClampedArray(uint8array),
      imageData.width,
      imageData.height,
    );

    return newImageData;
  } catch (error) {
    console.error("Erreur lors de l'application du dithering:", error);
    return imageData; // Retourner l'image originale en cas d'erreur
  }
};

/**
 * Calcule le ratio de compression entre l'image originale et compressée
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
 * Recadre une image selon les dimensions spécifiées
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
 * Floute les visages détectés dans une image
 */
export const blurFaces = async (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): Promise<void> => {
  try {
    console.log("Début de la détection des visages...");
    const detections = await faceapi.detectAllFaces(
      canvas,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }),
    );

    console.log(`${detections.length} visage(s) détecté(s)`);

    detections.forEach((detection) => {
      const box = detection.box;
      const margin = Math.max(box.width, box.height) * 0.3;
      const blurArea = {
        x: Math.max(0, box.x - margin),
        y: Math.max(0, box.y - margin),
        width: Math.min(canvas.width - box.x, box.width + 2 * margin),
        height: Math.min(canvas.height - box.y, box.height + 2 * margin),
      };

      ctx.filter = `blur(20px)`;
      ctx.drawImage(
        canvas,
        blurArea.x,
        blurArea.y,
        blurArea.width,
        blurArea.height,
        blurArea.x,
        blurArea.y,
        blurArea.width,
        blurArea.height,
      );
      ctx.filter = "none";
    });
  } catch (error) {
    console.error("Erreur lors du floutage des visages:", error);
  }
};

interface ProcessingCache {
  pointContainer: any;
  imageData: ImageData | null;
  lastOptions: any;
  paletteCache: Map<string, any>; // Cache des palettes par hash d'image
}

// Fonction pour générer un hash simple de l'image
const generateImageHash = (imageData: ImageData): string => {
  // On prend un échantillon de pixels pour créer un hash rapide
  const step = Math.max(1, Math.floor(imageData.data.length / 1000));
  let hash = "";
  for (let i = 0; i < imageData.data.length; i += step) {
    hash += imageData.data[i].toString(16);
  }
  return hash;
};

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
  cache?: ProcessingCache,
  onProgress?: (step: string, value: number) => void,
): Promise<Blob> => {
  console.log("processImage - Début du traitement:", {
    shouldApplyStyle,
    fileSize: file.size,
    applyBlur,
    colorCount,
    rotation,
    useCache: !!cache,
    cacheColorCount: cache?.lastOptions?.colorCount,
  });

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      // Étape 1: Préparation de l'image
      onProgress?.("Préparation de l'image", 0);
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Configuration du canvas et rotation
      if (rotation % 180 === 0) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = img.height;
        canvas.height = img.width;
      }
      onProgress?.("Préparation de l'image", 50);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Appliquer la rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      onProgress?.("Préparation de l'image", 100);

      let currentImageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      // Initialiser le cache de palette si nécessaire
      if (cache && !cache.paletteCache) {
        cache.paletteCache = new Map();
      }

      // Étape 2: Dithering (si activé)
      if (shouldApplyStyle) {
        onProgress?.("Préparation du dithering", 0);
        let palette;
        if (cache) {
          const imageHash = generateImageHash(currentImageData);
          const cacheKey = `${imageHash}-${colorCount}`;

          palette = cache.paletteCache.get(cacheKey);
          if (palette) {
            onProgress?.("Utilisation de la palette en cache", 100);
          } else {
            onProgress?.("Création de la palette", 0);
            const pointContainer = utils.PointContainer.fromUint8Array(
              currentImageData.data,
              currentImageData.width,
              currentImageData.height,
            );

            palette = await buildPalette([pointContainer], {
              colorDistanceFormula: "euclidean",
              paletteQuantization: "neuquant",
              colors: colorCount,
              onProgress: (progress: number) => {
                onProgress?.("Création de la palette", progress);
              },
            });

            if (palette) {
              cache.paletteCache.set(cacheKey, palette);
            }
          }
        }

        // Vérifier si le cache est valide pour l'image traitée
        const isCacheValid =
          cache?.imageData &&
          cache?.pointContainer &&
          cache.lastOptions &&
          cache.lastOptions.colorCount === colorCount &&
          cache.lastOptions.rotation === rotation &&
          cache.lastOptions.applyBlur === applyBlur;

        // Étape 3: Application du dithering
        if (!isCacheValid || !cache?.imageData) {
          onProgress?.("Application du dithering", 0);
          const pointContainer = utils.PointContainer.fromUint8Array(
            currentImageData.data,
            currentImageData.width,
            currentImageData.height,
          );

          if (!palette) {
            palette = await buildPalette([pointContainer], {
              colorDistanceFormula: "euclidean",
              paletteQuantization: "neuquant",
              colors: colorCount,
              onProgress: (progress: number) => {
                onProgress?.("Création de la palette", progress);
              },
            });
          }

          if (!palette) {
            throw new Error("La création de la palette a échoué");
          }

          const outPointContainer = await applyPalette(
            pointContainer,
            palette,
            {
              colorDistanceFormula: "euclidean",
              imageQuantization: "floyd-steinberg",
              onProgress: (progress: number) => {
                onProgress?.("Application du dithering", progress);
              },
            },
          );

          if (!outPointContainer) {
            throw new Error("L'application de la palette a échoué");
          }

          const uint8array = outPointContainer.toUint8Array();
          currentImageData = new ImageData(
            new Uint8ClampedArray(uint8array),
            currentImageData.width,
            currentImageData.height,
          );

          if (cache && !applyBlur) {
            cache.imageData = currentImageData;
            cache.pointContainer = pointContainer;
            cache.lastOptions = { colorCount, rotation, applyBlur };
          }

          ctx.putImageData(currentImageData, 0, 0);
        }
      }

      // Étape 4: Floutage des visages (si activé)
      if (applyBlur && modelsLoaded) {
        onProgress?.("Détection des visages", 0);
        await blurFaces(canvas, ctx);
        onProgress?.("Floutage des visages", 100);

        if (cache && shouldApplyStyle) {
          currentImageData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          cache.imageData = currentImageData;
          cache.pointContainer = utils.PointContainer.fromUint8Array(
            currentImageData.data,
            currentImageData.width,
            currentImageData.height,
          );
          cache.lastOptions = { colorCount, rotation, applyBlur };
        }
      }

      // Étape finale: Compression et finalisation
      onProgress?.("Finalisation", 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("processImage - Fin du traitement:", {
              resultSize: blob.size,
              shouldApplyStyle,
              withFilter: shouldApplyStyle,
              colorCount,
              applyBlur,
            });
            onProgress?.("Terminé", 100);
            resolve(blob);
          }
        },
        "image/jpeg",
        quality / 100,
      );
    };
    img.src = URL.createObjectURL(file);
  });
};
