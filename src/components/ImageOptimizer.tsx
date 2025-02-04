import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';

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

const ImageOptimizer: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState<number>(75);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);
  const [compressedStats, setCompressedStats] = useState<ImageStats | null>(null);

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
      const dimensions = await getImageDimensions(compressedFile);
      
      setCompressedStats({
        size: compressedFile.size,
        width: dimensions.width,
        height: dimensions.height,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setCompressedImage(reader.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(compressedFile);
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
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={downloadImage}
                  sx={{ mt: 2 }}
                >
                  Télécharger l&apos;image optimisée
                </Button>
              </>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ImageOptimizer; 