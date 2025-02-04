import React, { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import * as faceapi from 'face-api.js';
import { ReactCrop, type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import * as exifr from 'exifr';
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
  Link,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import { ImageStats, ImageMetadata } from '../types/ImageOptimizer.types';
import {
  formatFileSize,
  hexToRgb,
  hasMetadata,
  getImageDimensions,
  extractMetadata,
  applyMonochromeEffect,
  processImage,
  getCroppedImg,
  calculateCompressionRatio
} from '../utils/imageUtils';

const DEFAULT_FLUO_COLOR = '#9DFF20';

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
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  });
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Début du chargement des modèles de détection de visages...');
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        console.log('Modèle de détection de visages chargé avec succès');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Erreur lors du chargement des modèles:', error);
        setModelsLoaded(false);
      }
    };
    loadModels();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dimensions = await getImageDimensions(file);
    const imageMetadata = await extractMetadata(file);
    
    setMetadata(imageMetadata);
    setOriginalStats({
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
    });
    setOriginalImage(file);
    await compressImage(file);
  };

  const blurFaces = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
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
      const processedBlob = await processImage(
        compressedFile,
        fluorColor,
        applyStyle,
        quality,
        applyBlur,
        modelsLoaded,
        canvasRef
      );
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
        const processedBlob = await processImage(
          originalImage,
          newColor,
          applyStyle,
          quality,
          applyBlur,
          modelsLoaded,
          canvasRef
        );
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

  const handleStyleChange = async (newValue: boolean) => {
    setApplyStyle(newValue);
    if (originalImage) {
      setLoading(true);
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: maxWidth,
          useWebWorker: true,
          quality: quality / 100,
        };
        const compressedFile = await imageCompression(originalImage, options);
        const processedBlob = await processImage(
          compressedFile,
          fluorColor,
          newValue,
          quality,
          applyBlur,
          modelsLoaded,
          canvasRef
        );
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

  const handleCropComplete = async () => {
    if (!imageRef.current || !crop.width || !crop.height) return;

    try {
      setLoading(true);
      const croppedBlob = await getCroppedImg(imageRef.current, crop, quality);
      const processedBlob = await processImage(
        new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' }),
        fluorColor,
        applyStyle,
        quality,
        applyBlur,
        modelsLoaded,
        canvasRef
      );
      
      const dimensions = await getImageDimensions(processedBlob);
      setCompressedStats({
        size: processedBlob.size,
        width: dimensions.width,
        height: dimensions.height,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setCompressedImage(reader.result as string);
        setIsCropping(false);
        setLoading(false);
      };
      reader.readAsDataURL(processedBlob);
    } catch (error) {
      console.error('Erreur lors du recadrage:', error);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Optimiseur d&apos;Images 
        </Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Optimisez vos images en étant sympa avec la planète et avec la vie privée de ses habitant.e.s ! 
          </Typography>
          <Typography component="div" variant="body2" sx={{ mb: 2 }}>
            <strong>Fonctionnalités :</strong>
            <ul>
              <li>Compression intelligente avec contrôle de la qualité</li>
              <li>Floutage automatique des visages</li>
              <li>Outils de recadrage et rotation</li>
              <li>Lecture des meta-données</li>
            </ul>
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
            ✨ Toutes les images sont traitées localement dans votre navigateur - Aucun envoi sur un serveur !
          </Typography>
        </Paper>

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
          <Paper sx={{ p: 2, mb: 3 }}>
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
                  • Réduction: {calculateCompressionRatio(originalStats, compressedStats)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {metadata && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Métadonnées de l&apos;image
            </Typography>
            {hasMetadata(metadata) ? (
              <Grid container spacing={2}>
                {metadata.Make && (
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Appareil:</strong> {metadata.Make} {metadata.Model}
                    </Typography>
                  </Grid>
                )}
                {metadata.DateTimeOriginal && (
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Date de prise:</strong> {new Date(metadata.DateTimeOriginal).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {metadata.ExposureTime && (
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Temps d&apos;exposition:</strong> {metadata.ExposureTime}s
                    </Typography>
                  </Grid>
                )}
                {metadata.FNumber && (
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Ouverture:</strong> f/{metadata.FNumber}
                    </Typography>
                  </Grid>
                )}
                {metadata.ISO && (
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>ISO:</strong> {metadata.ISO}
                    </Typography>
                  </Grid>
                )}
                {metadata.FocalLength && (
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Distance focale:</strong> {metadata.FocalLength}mm
                    </Typography>
                  </Grid>
                )}
                {metadata.latitude && metadata.longitude && (
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Localisation:</strong> {metadata.latitude.toFixed(6)}, {metadata.longitude.toFixed(6)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Aucune métadonnée n&apos;est disponible pour cette image.
              </Typography>
            )}
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
                  {isCropping ? (
                    <ReactCrop
                      crop={crop}
                      onChange={(c: Crop) => setCrop(c)}
                      aspect={undefined}
                    >
                      <img
                        ref={imageRef}
                        src={compressedImage}
                        style={{ maxWidth: '100%' }}
                        alt="À recadrer"
                      />
                    </ReactCrop>
                  ) : (
                    <Box
                      component="img"
                      src={compressedImage}
                      sx={{ maxWidth: '100%', height: 'auto' }}
                      alt="Compressed"
                    />
                  )}
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Tooltip title="Pivoter l'image">
                      <IconButton onClick={rotateImage} color="primary">
                        <RotateRightIcon />
                      </IconButton>
                    </Tooltip>
                    {isCropping ? (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleCropComplete}
                        >
                          Appliquer le recadrage
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setIsCropping(false)}
                        >
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          onClick={() => setIsCropping(true)}
                        >
                          Recadrer
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={downloadImage}
                        >
                          Télécharger l&apos;image optimisée
                        </Button>
                      </>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <Box 
        component="footer" 
        sx={{ 
          p: 2, 
          mt: 3, 
          borderTop: 1, 
          borderColor: 'divider',
          textAlign: 'center',
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Les contributions sont les bienvenues ! 
          <Link 
            href="https://github.com/Alice-Po/image-ecolo" 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ ml: 1 }}
          >
            Voir le projet sur GitHub
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary">
            Made in Boccagia        </Typography>
      </Box>
    </Card>
  );
};

export default ImageOptimizer; 