import * as faceapi from "face-api.js";

/**
 * Custom hook to handle face detection and blurring in images
 * Uses face-api.js for face detection and canvas manipulation for blurring
 * @returns Functions and utilities for face blurring
 */
export const useFaceBlur = () => {
  /**
   * Blurs detected faces in an image
   * Uses SSD MobileNet for face detection and applies a Gaussian blur effect
   *
   * @param canvas The canvas containing the image to process
   * @param ctx The 2D rendering context of the canvas
   */
  const blurFaces = async (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): Promise<void> => {
    try {
      console.log("Starting face detection...");
      const detections = await faceapi.detectAllFaces(
        canvas,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }),
      );

      console.log(`${detections.length} face(s) detected`);

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
      console.error("Error during face blurring:", error);
    }
  };

  return {
    blurFaces,
  };
};
