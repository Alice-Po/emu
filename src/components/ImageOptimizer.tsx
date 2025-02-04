import React, { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import * as faceapi from 'face-api.js';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Slider,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import BlurOnIcon from '@mui/icons-material/BlurOn';

interface ImageStats {
  size: number;
  width: number;
  height: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const DEFAULT_FLUO_COLOR = '#9DFF20';

const hexToRgb = (hex: string) => {
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

const ImageOptimizer: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState<number>(75);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);
  const [compressedStats, setCompressedStats] = useState<ImageStats | null>(null);
  const [applyStyle, setApplyStyle] = useState<boolean>(true);
  const [fluorColor, setFluorColor] = useState<string>(DEFAULT_FLUO_COLOR);
  const [rotation, setRotation] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [applyBlur, setApplyBlur] = useState<boolean>(true);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Début du chargement des modèles de détection de visages...');
        // Charger les modèles plus complets
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        console.log('Modèles de détection de visages chargés avec succès');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Erreur lors du chargement des modèles:', error);
        setModelsLoaded(false);
      }
    };
    loadModels();
  }, []);

  const getImageDimensions = (file: File | Blob): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dimensions = await getImageDimensions(file);
    setOriginalStats({
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
    });
    setOriginalImage(file);
    await compressImage(file);
  };

  const applyMonochromeEffect = (imageData: ImageData, color: string): ImageData => {
    const data = imageData.data;
    const rgbColor = hexToRgb(color);

    for (let i = 0; i < data.length; i += 4) {
      // Convertir en niveau de gris
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      
      // Appliquer l&apos;effet monochrome avec la couleur fluo choisie
      const mixRatio = 0.7;  // 70% gris, 30% couleur
      data[i] = Math.min(255, gray * mixRatio + (rgbColor.r * (1 - mixRatio)));     // Rouge
      data[i + 1] = Math.min(255, gray * mixRatio + (rgbColor.g * (1 - mixRatio))); // Vert
      data[i + 2] = Math.min(255, gray * mixRatio + (rgbColor.b * (1 - mixRatio))); // Bleu
      // Alpha reste inchangé
    }
    return imageData;
  };

  const blurFaces = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    try {
      console.log('Début de la détection des visages...');
    const detections = await faceapi.detectAllFaces(
      canvas,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 })
      ).withFaceLandmarks();

      console.log(`${detections.length} visage(s) détecté(s)`);

      detections.forEach(detection => {
        const box = detection.detection.box;
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

  const processImage = async (file: File, currentColor: string, shouldApplyStyle: boolean): Promise<Blob> => {
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

        // Dessiner l&apos;image originale
        ctx.drawImage(img, 0, 0);

        // Flouter les visages si activé
        if (applyBlur && modelsLoaded) {
          console.log('processImage - Application du floutage des visages');
          await blurFaces(canvas, ctx);
        }

        // Appliquer l&apos;effet monochrome si activé
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

  const compressImage = async (imageFile: File) => {
    try {
      setLoading(true);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: maxWidth,
        useWebWorker: true,
        quality: quality / 100,
      };

      const compressedFile = await imageCompression(imageFile, options);
      const processedBlob = await processImage(compressedFile, fluorColor, applyStyle);
      const dimensions = await getImageDimensions(processedBlob);
      
      setCompressedStats({
        size: processedBlob.size,
        width: dimensions.width,
        height: dimensions.height,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setCompressedImage(reader.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(processedBlob);
    } catch (error) {
      console.error('Erreur lors de la compression:', error);
      setLoading(false);
    }
  };

  const handleQualityChange = (_event: Event, newValue: number | number[]) => {
    setQuality(newValue as number);
    if (originalImage) {
      compressImage(originalImage);
    }
  };

  const handleMaxWidthChange = (_event: Event, newValue: number | number[]) => {
    setMaxWidth(newValue as number);
    if (originalImage) {
      compressImage(originalImage);
    }
  };

  const handleColorChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    if (originalImage) {
      setLoading(true);
      try {
        const processedBlob = await processImage(originalImage, newColor, applyStyle);
        const dimensions = await getImageDimensions(processedBlob);
        
        setCompressedStats({
          size: processedBlob.size,
          width: dimensions.width,
          height: dimensions.height,
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          setFluorColor(newColor);
          setCompressedImage(reader.result as string);
          setLoading(false);
        };
        reader.readAsDataURL(processedBlob);
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la couleur:', error);
        setLoading(false);
      }
    } else {
      setFluorColor(newColor);
    }
  };

  const downloadImage = () => {
    if (!compressedImage) return;

    const link = document.createElement('a');
    link.href = compressedImage;
    link.download = 'optimized-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const compressionRatio = (): string => {
    if (!originalStats || !compressedStats) return '0%';
    const ratio = ((originalStats.size - compressedStats.size) / originalStats.size) * 100;
    return `${ratio.toFixed(1)}%`;
  };

  const handleStyleChange = async (newValue: boolean) => {
    console.log('handleStyleChange - Début:', {
      oldValue: applyStyle,
      newValue,
      hasImage: !!originalImage
    });

    setApplyStyle(newValue);
    if (originalImage) {
      setLoading(true);
      try {
        if (!newValue) {
          console.log('handleStyleChange - Mode couleur original');
          // Si on désactive le monochrome, on recompresse l'image originale
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: maxWidth,
            useWebWorker: true,
            quality: quality / 100,
          };
          const compressedFile = await imageCompression(originalImage, options);
          const processedBlob = await processImage(compressedFile, fluorColor, false);
          const dimensions = await getImageDimensions(processedBlob);
          
          setCompressedStats({
            size: processedBlob.size,
            width: dimensions.width,
            height: dimensions.height,
          });

          const reader = new FileReader();
          reader.onloadend = () => {
            setCompressedImage(reader.result as string);
            setLoading(false);
          };
          reader.readAsDataURL(processedBlob);
        } else {
          console.log('handleStyleChange - Mode monochrome:', {
            fluorColor,
            quality,
            maxWidth
          });
          // Si on active le monochrome, on compresse d'abord puis on applique l'effet
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: maxWidth,
            useWebWorker: true,
            quality: quality / 100,
          };
          const compressedFile = await imageCompression(originalImage, options);
          console.log('handleStyleChange - Après compression:', {
            compressedSize: compressedFile.size
          });

          const processedBlob = await processImage(compressedFile, fluorColor, true);
          console.log('handleStyleChange - Après processImage:', {
            processedSize: processedBlob.size,
            fluorColor
          });

          const dimensions = await getImageDimensions(processedBlob);
          
          setCompressedStats({
            size: processedBlob.size,
            width: dimensions.width,
            height: dimensions.height,
          });

          const reader = new FileReader();
          reader.onloadend = () => {
            setCompressedImage(reader.result as string);
            setLoading(false);
            console.log('handleStyleChange - Traitement terminé');
          };
          reader.readAsDataURL(processedBlob);
        }
      } catch (error) {
        console.error('Erreur lors du changement de style:', error);
        setLoading(false);
      }
    }
  };

  const rotateImage = async () => {
    if (!originalImage) return;
    
    setLoading(true);
    try {
      const newRotation = (rotation + 90) % 360;
      setRotation(newRotation);
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const img = new Image();
      img.onload = async () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ajuster les dimensions du canvas pour la rotation
        if (newRotation % 180 === 0) {
          canvas.width = img.width;
          canvas.height = img.height;
        } else {
          canvas.width = img.height;
          canvas.height = img.width;
        }

        // Appliquer la rotation
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((newRotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Appliquer le filtre monochrome si nécessaire
        if (applyStyle) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const processedImageData = applyMonochromeEffect(imageData, fluorColor);
          ctx.putImageData(processedImageData, 0, 0);
        }

        // Convertir en blob et mettre à jour l'image
        canvas.toBlob(async (blob) => {
          if (blob) {
            const dimensions = await getImageDimensions(blob);
            setCompressedStats({
              size: blob.size,
              width: dimensions.width,
              height: dimensions.height,
            });

            const reader = new FileReader();
            reader.onloadend = () => {
              setCompressedImage(reader.result as string);
              setLoading(false);
            };
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', quality / 100);
      };

      img.src = URL.createObjectURL(originalImage);
    } catch (error) {
      console.error('Erreur lors de la rotation:', error);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Optimiseur d&apos;Images
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
          >
            Télécharger une image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageUpload}
            />
          </Button>
        </Box>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item>
            <FormControlLabel
              control={
                <Switch
                  checked={applyStyle}
                  onChange={(e) => handleStyleChange(e.target.checked)}
                />
              }
              label="Activer le monochrome"
            />
          </Grid>
          {applyStyle && (
            <Grid item>
              <TextField
                type="color"
                value={fluorColor}
                onChange={handleColorChange}
                sx={{ width: 150 }}
                label="Couleur fluo"
                size="small"
              />
            </Grid>
          )}
          <Grid item>
            <FormControlLabel
              control={
                <Switch
                  checked={applyBlur}
                  onChange={(e) => {
                    setApplyBlur(e.target.checked);
                    if (originalImage) {
                      compressImage(originalImage);
                    }
                  }}
                  disabled={!modelsLoaded}
                />
              }
              label="Flouter les visages"
            />
          </Grid>
        </Grid>

        {originalStats && compressedStats && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Image originale:
                </Typography>
                <Typography>
                  • Taille: {formatFileSize(originalStats.size)}
                </Typography>
                <Typography>
                  • Dimensions: {originalStats.width}x{originalStats.height}px
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Image compressée:
                </Typography>
                <Typography>
                  • Taille: {formatFileSize(compressedStats.size)}
                </Typography>
                <Typography>
                  • Dimensions: {compressedStats.width}x{compressedStats.height}px
                </Typography>
                <Typography>
                  • Réduction: {compressionRatio()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Qualité de compression (%)</Typography>
            <Slider
              value={quality}
              onChange={handleQualityChange}
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Largeur maximale (px)</Typography>
            <Slider
              value={maxWidth}
              onChange={handleMaxWidthChange}
              min={100}
              max={3840}
              step={100}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Image originale
            </Typography>
            {originalImage && (
              <Box
                component="img"
                src={URL.createObjectURL(originalImage)}
                sx={{ maxWidth: '100%', height: 'auto' }}
                alt="Original"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative' }}>
              <Typography variant="subtitle1" gutterBottom>
                Image optimisée
              </Typography>
              {compressedImage && (
                <>
                  <Box
                    component="img"
                    src={compressedImage}
                    sx={{ maxWidth: '100%', height: 'auto' }}
                    alt="Compressed"
                  />
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Tooltip title="Pivoter l'image">
                      <IconButton onClick={rotateImage} color="primary">
                        <RotateRightIcon />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={downloadImage}
                    >
                      Télécharger l&apos;image optimisée
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Card>
  );
};

export default ImageOptimizer; 