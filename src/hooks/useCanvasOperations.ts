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
    (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => {
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
    },
    [],
  );

  return {
    canvasRef,
    setupCanvas,
    createBlobFromCanvas,
  };
};
