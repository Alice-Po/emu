import { useCallback, useRef } from "react";

/**
 * Hook to handle basic canvas operations
 * Encapsulates image manipulation and rotation logic
 */
export const useCanvasOperations = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Sets up the canvas and applies initial rotation
   */
  const setupCanvas = useCallback(
    (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      rotation = 0,
    ) => {
      // Configure canvas dimensions based on rotation
      if (rotation % 180 === 0) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = img.height;
        canvas.height = img.width;
      }

      // Apply rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    [],
  );

  /**
   * Creates a blob from the canvas
   */
  const createBlobFromCanvas = useCallback(
    (
      canvas: HTMLCanvasElement,
      options: {
        mimeType: string;
        quality: number;
      },
    ): Promise<Blob> => {
      console.log("Creating blob with options:", options);

      return new Promise((resolve) => {
        try {
          const isPNG = options.mimeType === "image/png";

          // Vérifier si le type est supporté
          const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
          const finalType = supportedTypes.includes(options.mimeType)
            ? options.mimeType
            : "image/jpeg";

          console.log("Using mime type:", finalType);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create blob"));
                return;
              }
              console.log("Created blob type:", blob.type);
              resolve(blob);
            },
            finalType,
            isPNG ? undefined : options.quality / 100,
          );
        } catch (error) {
          console.error("Error in createBlobFromCanvas:", error);
          reject(error);
        }
      });
    },
    [],
  );

  return {
    canvasRef,
    setupCanvas,
    createBlobFromCanvas,
  };
};
