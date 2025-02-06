import imageCompression from "browser-image-compression";
import { useCallback, useRef, useState } from "react";
import { ImageMetadata, ImageStats } from "../types/ImageOptimizer.types";
import {
  extractMetadata,
  getImageDimensions,
  processImageWhithStyle,
} from "../utils/imageUtils";

interface ProcessingOptions {
  quality: number;
  maxWidth: number;
  applyStyle: boolean;
  applyBlur: boolean;
  colorCount: number;
  rotation?: number;
}

interface ProcessingCache {
  pointContainer: any;
  imageData: ImageData | null;
  lastOptions: ProcessingOptions | null;
  paletteCache: Map<string, any>;
}

export const useImageProcessor = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{
    step: string;
    value: number;
  }>({
    step: "",
    value: 0,
  });
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);
  const [compressedStats, setCompressedStats] = useState<ImageStats | null>(
    null,
  );
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCache = useRef<ProcessingCache>({
    pointContainer: null,
    imageData: null,
    lastOptions: null,
    paletteCache: new Map(),
  });

  const shouldReprocess = (
    currentOptions: ProcessingOptions,
    file: File,
  ): boolean => {
    const cache = processingCache.current;
    if (!cache.lastOptions) return true;

    // Si le fichier a changé, on doit retraiter
    if (!originalImage || file !== originalImage) return true;

    // Si les options qui affectent la compression ont changé
    if (
      currentOptions.maxWidth !== cache.lastOptions.maxWidth ||
      currentOptions.quality !== cache.lastOptions.quality
    )
      return true;

    // Si le style est activé/désactivé
    if (currentOptions.applyStyle !== cache.lastOptions.applyStyle) return true;

    // Si le style est activé et que les options de style ont changé
    if (
      currentOptions.applyStyle &&
      currentOptions.colorCount !== cache.lastOptions.colorCount
    )
      return true;

    // Si la rotation a changé
    if (currentOptions.rotation !== cache.lastOptions.rotation) return true;

    // Si le floutage a changé
    if (currentOptions.applyBlur !== cache.lastOptions.applyBlur) return true;

    return false;
  };

  const processImage = useCallback(
    async (file: File, options: ProcessingOptions) => {
      console.log("Options de traitement:", options);
      if (!file) return;

      setLoading(true);
      setProgress({
        step: "Initialisation...",
        value: 0,
      });

      try {
        // Vérifier si on peut réutiliser le cache
        if (!shouldReprocess(options, file)) {
          console.log("Utilisation du cache pour le traitement");
          const processedBlob = await processImageWhithStyle(
            file,
            options.applyStyle,
            options.quality,
            options.applyBlur,
            true,
            canvasRef,
            options.colorCount,
            options.rotation || 0,
            processingCache.current,
            (step: string, value: number) => {
              setProgress({
                step,
                value,
              });
            },
          );

          // Mise à jour des stats compressées
          const compressedDimensions = await getImageDimensions(processedBlob);
          setCompressedStats({
            size: processedBlob.size,
            width: compressedDimensions.width,
            height: compressedDimensions.height,
          });

          // Conversion en URL de données
          const reader = new FileReader();
          reader.onloadend = () => {
            setCompressedImage(reader.result as string);
            setLoading(false);
          };
          reader.readAsDataURL(processedBlob);
          return;
        }

        // Si on ne peut pas utiliser le cache, on fait un traitement complet
        console.log("Nouveau traitement complet");
        const [dimensions, imageMetadata] = await Promise.all([
          getImageDimensions(file),
          extractMetadata(file),
        ]);

        setMetadata(imageMetadata);
        setOriginalStats({
          size: file.size,
          width: dimensions.width,
          height: dimensions.height,
        });

        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: options.maxWidth,
          useWebWorker: true,
          quality: options.quality / 100,
        };

        const compressedFile = await imageCompression(file, compressionOptions);

        // Mise à jour du cache avec les nouvelles options
        processingCache.current.lastOptions = { ...options };

        const processedBlob = await processImageWhithStyle(
          compressedFile,
          options.applyStyle,
          options.quality,
          options.applyBlur,
          true,
          canvasRef,
          options.colorCount,
          options.rotation || 0,
          processingCache.current,
          (step: string, value: number) => {
            setProgress({
              step,
              value,
            });
          },
        );

        const compressedDimensions = await getImageDimensions(processedBlob);
        setCompressedStats({
          size: processedBlob.size,
          width: compressedDimensions.width,
          height: compressedDimensions.height,
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          setCompressedImage(reader.result as string);
          setLoading(false);
        };
        reader.readAsDataURL(processedBlob);
      } catch (error) {
        console.error("Erreur lors du traitement:", error);
        setLoading(false);
        setProgress({
          step: "",
          value: 0,
        });
      }
    },
    [originalImage],
  );

  const reset = useCallback(() => {
    setOriginalImage(null);
    setCompressedImage(null);
    setOriginalStats(null);
    setCompressedStats(null);
    setMetadata(null);
    setLoading(false);
    processingCache.current = {
      pointContainer: null,
      imageData: null,
      lastOptions: null,
      paletteCache: new Map(),
    };
  }, []);

  const clearCache = useCallback(() => {
    processingCache.current = {
      pointContainer: null,
      imageData: null,
      lastOptions: null,
      paletteCache: new Map(),
    };
  }, []);

  return {
    loading,
    progress,
    originalImage,
    compressedImage,
    originalStats,
    compressedStats,
    metadata,
    canvasRef,
    processImage,
    setOriginalImage,
    reset,
    clearCache,
  };
};
