/**
 * ImageOptimizer Component
 *
 * A comprehensive image processing component that provides various optimization and editing features.
 * All processing is done locally in the browser without server uploads.
 *
 * Features:
 * - Image compression with quality control
 * - Face detection and automatic blurring
 * - Image cropping and rotation
 * - Dithering effect with customizable color palette
 * - EXIF metadata extraction
 *
 * @component
 */

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Slider,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import * as faceapi from "face-api.js";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReactCrop, type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useDebounce } from "../hooks/useDebounce";
import { useImageProcessor } from "../hooks/useImageProcessor";
import {
  calculateCompressionRatio,
  formatFileSize,
  getCroppedImg,
  hasMetadata,
} from "../utils/imageUtils";
import DitheringControls from "./DitheringControls";
import FeaturesDescription from "./FeaturesDescription";
import Footer from "./Footer";
import LanguageSelector from "./LanguageSelector";

/**
 * Main ImageOptimizer component that handles all image processing operations
 * @returns {JSX.Element} The rendered component
 */
const ImageOptimizer: React.FC = () => {
  const { t } = useTranslation();
  const {
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
  } = useImageProcessor();

  const [quality, setQuality] = useState<number>(75);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [applyDithering, setApplyDithering] = useState<boolean>(false);
  const [ditheringColorCount, setDitheringColorCount] = useState<number>(32);
  const [applyBlur, setApplyBlur] = useState<boolean>(false);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(
    "Patience, votre image est en cours de traitement..",
  );
  const [maxWidthLimit, setMaxWidthLimit] = useState<number>(3840);
  const loadingSectionRef = useRef<HTMLDivElement>(null);

  /**
   * Debounced function that handles parameter changes for image processing
   * Prevents excessive reprocessing when sliding controls
   *
   * @param {Object} params - The parameters to update
   * @param {string} params.name - The name of the parameter to update (quality, maxWidth, or colorCount)
   * @param {number} params.value - The new value for the parameter
   */
  const debouncedProcessWithParams = useDebounce(
    (params: { name: string; value: number }) => {
      if (!originalImage) return;

      const options = {
        quality,
        maxWidth,
        applyDithering: applyDithering,
        applyBlur,
        ditheringColorCount: ditheringColorCount,
        [params.name]: params.value,
      };

      processImage(originalImage, options);
    },
    500,
  );

  /**
   * Handles changes to the quality slider
   * Updates the quality state and triggers debounced image processing
   *
   * @param {Event} _event - The event object (unused)
   * @param {number | number[]} newValue - The new quality value
   */
  const handleQualityChange = (_event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setQuality(value);
    debouncedProcessWithParams({ name: "quality", value });
  };

  /**
   * Handles changes to the maximum width slider
   * Updates the maxWidth state and triggers debounced image processing
   * The maximum width is limited to the original image width
   *
   * @param {Event} _event - The event object (unused)
   * @param {number | number[]} newValue - The new maximum width value
   */
  const handleMaxWidthChange = (_event: Event, newValue: number | number[]) => {
    const value = Math.min(newValue as number, maxWidthLimit);
    setMaxWidth(value);
    debouncedProcessWithParams({ name: "maxWidth", value });
  };

  /**
   * Handles changes to the color count slider for dithering effect
   * Updates the colorCount state and triggers debounced image processing
   *
   * @param {Event} _event - The event object (unused)
   * @param {number | number[]} newValue - The new color count value
   */
  const handleDitheringColorCountChange = (
    _event: Event,
    newValue: number | number[],
  ) => {
    const value = newValue as number;
    setDitheringColorCount(value);
    debouncedProcessWithParams({ name: "ditheringColorCount", value });
  };

  /**
   * Handles toggling of the dithering effect
   * Immediately processes the image with the new style setting
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event
   */
  const handleDitheringChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.checked;
    setApplyDithering(value);
    if (originalImage) {
      processImage(originalImage, {
        quality,
        maxWidth,
        applyDithering: value,
        applyBlur,
        ditheringColorCount: ditheringColorCount,
      });
    }
  };

  /**
   * Handles toggling of the face blur effect
   * Immediately processes the image with the new blur setting
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event
   */
  const handleBlurChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.checked;
    setApplyBlur(value);
    if (originalImage) {
      processImage(originalImage, {
        quality,
        maxWidth,
        applyDithering: applyDithering,
        applyBlur: value,
        ditheringColorCount: ditheringColorCount,
      });
    }
  };

  /**
   * Initiates download of the processed image
   * Creates a temporary link element to trigger the download
   */
  const downloadImage = () => {
    if (!compressedImage) return;

    const link = document.createElement("a");
    link.href = compressedImage;
    link.download = "optimized-image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Handles image rotation in 90-degree increments
   * Immediately processes the image with the new rotation
   */
  const handleRotation = async () => {
    if (!originalImage) return;
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);

    await processImage(originalImage, {
      quality,
      maxWidth,
      applyDithering: applyDithering,
      applyBlur,
      ditheringColorCount: ditheringColorCount,
      rotation: newRotation,
    });
  };

  /**
   * Completes the cropping operation
   * Creates a new image from the cropped area and processes it
   */
  const handleCropComplete = async () => {
    if (!imageRef.current || !crop.width || !crop.height) return;

    try {
      const croppedBlob = await getCroppedImg(imageRef.current, crop, quality);
      const croppedFile = new File([croppedBlob], "cropped.jpg", {
        type: "image/jpeg",
      });

      await processImage(croppedFile, {
        quality,
        maxWidth,
        applyDithering: applyDithering,
        applyBlur,
        ditheringColorCount: ditheringColorCount,
      });

      setIsCropping(false);
    } catch (error) {
      console.error("Erreur lors du recadrage:", error);
    }
  };

  /**
   * Effect hook to load face detection models on component mount
   * Initializes the face-api.js models for face detection and blurring
   */
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log(
          "Début du chargement des modèles de détection de visages...",
        );
        await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
        console.log("Modèle de détection de visages chargé avec succès");
        setModelsLoaded(true);
      } catch (error) {
        console.error("Erreur lors du chargement des modèles:", error);
        setModelsLoaded(false);
      }
    };
    loadModels();
  }, []);

  /**
   * Effect hook to manage loading messages
   * Updates the loading message with humorous text based on processing duration
   * Messages change at 5s and 8s intervals
   */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      setLoadingMessage(t("loading.initial"));
      timeoutId = setTimeout(() => {
        setLoadingMessage(t("loading.long"));
      }, 5000);
      timeoutId = setTimeout(() => {
        setLoadingMessage(t("loading.veryLong"));
      }, 8000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading, t]);

  const scrollToLoadingSection = () => {
    if (loadingSectionRef.current) {
      const yOffset = -100;
      const element = loadingSectionRef.current;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  };

  /**
   * Handles initial image upload
   * Sets the original image and triggers initial processing
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event
   */
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setOriginalImage(file);
    await processImage(file, {
      quality,
      maxWidth,
      applyDithering: applyDithering,
      applyBlur,
      ditheringColorCount: ditheringColorCount,
    });
  };

  // Add effect to handle scroll when loading state changes
  useEffect(() => {
    if (loading && loadingSectionRef.current) {
      setTimeout(() => {
        scrollToLoadingSection();
      }, 100);
    }
  }, [loading]);

  useEffect(() => {
    if (originalStats?.width) {
      if (maxWidth > originalStats.width) {
        setMaxWidth(originalStats.width);
      }
      setMaxWidthLimit(originalStats.width);
    }
  }, [originalStats?.width]);

  return (
    <main role="main" aria-label="Image optimizer interface">
      <Card>
        <CardContent>
          <Box
            component="section"
            aria-labelledby="page-title"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h1"
              id="page-title"
              sx={{
                fontSize: "h3.fontSize",
                mb: 3,
              }}
            >
              {t("title")} <small>{t("beta")}</small>
            </Typography>
            <LanguageSelector />
          </Box>

          <FeaturesDescription />

          <Box
            component="section"
            aria-labelledby="upload-section-title"
            sx={{ mb: 3 }}
          >
            <label htmlFor="image-upload">
              <input
                type="file"
                id="image-upload"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUploadIcon />}
              >
                {t("uploadButton")}
              </Button>
            </label>
          </Box>

          {originalStats && compressedStats && (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                bgcolor: "background.paper",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 4,
                  alignItems: "center",
                  position: "relative",
                }}
              >
                {/* Colonne de gauche - Image originale */}
                <Box
                  sx={{
                    flex: 1,
                    width: "100%",
                    p: 2,
                    bgcolor: "#1E1E1E",
                    borderRadius: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    color="grey.300"
                    variant="h2"
                    gutterBottom
                    sx={{
                      transition: "color 0.3s ease",
                      fontSize: { xs: "h6.fontSize", sm: "h6.fontSize" },
                    }}
                  >
                    {t("stats.original.title")}
                  </Typography>
                  <Typography
                    variant="h3"
                    color="grey.100"
                    sx={{
                      mb: 1,
                      fontSize: { xs: "h4.fontSize", sm: "h4.fontSize" },
                    }}
                  >
                    {formatFileSize(originalStats.size)}
                  </Typography>
                  <Typography color="grey.400">
                    {t("stats.original.dimensions", {
                      width: originalStats.width,
                      height: originalStats.height,
                    })}
                  </Typography>
                </Box>

                {/* Indicateur central de réduction */}
                <Box
                  sx={{
                    position: { xs: "relative", md: "absolute" },
                    left: { md: "50%" },
                    transform: { md: "translateX(-50%)" },
                    zIndex: 2,
                    width: 180,
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {loading ? (
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#1E1E1E",
                        borderRadius: "50%",
                      }}
                    >
                      <CircularProgress
                        size={60}
                        thickness={4}
                        sx={{ color: "#9DFF20" }}
                      />
                    </Box>
                  ) : (
                    <>
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          position: "absolute",
                          background: `conic-gradient(
                            #9DFF20 0deg,
                            #9DFF20 ${parseFloat(calculateCompressionRatio(originalStats, compressedStats)) * 3.6}deg,
                            transparent ${parseFloat(calculateCompressionRatio(originalStats, compressedStats)) * 3.6}deg
                          )`,
                          borderRadius: "50%",
                          transform: "rotate(-90deg)",
                        }}
                      />
                      <Box
                        sx={{
                          width: "92%",
                          height: "92%",
                          bgcolor: "#1E1E1E",
                          borderRadius: "50%",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: "bold",
                            color: "#9DFF20",
                            lineHeight: 1,
                          }}
                        >
                          {calculateCompressionRatio(
                            originalStats,
                            compressedStats,
                          )}
                        </Typography>
                        <Typography
                          sx={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {t("stats.reduction.label")}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>

                {/* Colonne de droite - Image compressée */}
                <Box
                  sx={{
                    flex: 1,
                    width: "100%",
                    p: 2,
                    bgcolor: loading ? "#1E1E1E" : "#9DFF20",
                    borderRadius: 1,
                    textAlign: "center",
                    position: "relative",
                    transition: "background-color 0.3s ease",
                    "&::before": !loading
                      ? {
                          content: '""',
                          position: "absolute",
                          left: -100,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 100,
                          height: 100,
                          background: "#9DFF20",
                          clipPath: "circle(50% at 100% 50%)",
                        }
                      : undefined,
                  }}
                >
                  <Typography
                    variant="h3"
                    gutterBottom
                    sx={{
                      color: loading ? "grey.300" : "rgba(0, 0, 0, 0.87)",
                      transition: "color 0.3s ease",
                      fontSize: { xs: "h6.fontSize", sm: "h6.fontSize" },
                    }}
                  >
                    {t("stats.optimized.title")}
                  </Typography>
                  {loading ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: 100,
                      }}
                    >
                      <CircularProgress sx={{ color: "#9DFF20" }} />
                    </Box>
                  ) : (
                    <>
                      <Typography
                        variant="h4"
                        sx={{
                          color: "rgba(0, 0, 0, 0.87)",
                          mb: 1,
                          fontWeight: "bold",
                        }}
                      >
                        {formatFileSize(compressedStats.size)}
                      </Typography>
                      <Typography sx={{ color: "rgba(0, 0, 0, 0.7)" }}>
                        {t("stats.optimized.dimensions", {
                          width: compressedStats.width,
                          height: compressedStats.height,
                        })}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>

              {!loading && (
                <Typography
                  variant="body1"
                  sx={{
                    mt: 3,
                    textAlign: "center",
                    color: "#9DFF20",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(0,0,0,0.7)",
                    display: "inline-block",
                    margin: "0 auto",
                    marginTop: 3,
                  }}
                >
                  {parseFloat(
                    calculateCompressionRatio(originalStats, compressedStats),
                  ) >= 70
                    ? t("stats.reduction.excellent")
                    : parseFloat(
                          calculateCompressionRatio(
                            originalStats,
                            compressedStats,
                          ),
                        ) >= 40
                      ? t("stats.reduction.good")
                      : t("stats.reduction.moderate")}
                </Typography>
              )}
            </Paper>
          )}

          <Grid
            container
            spacing={3}
            sx={{ mb: 4 }}
            role="group"
            aria-label={t("controls.basic.title")}
          >
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: { xs: 2, sm: 3 },
                  backgroundColor: "background.default",
                  borderRadius: 2,
                  boxShadow: (theme) => theme.shadows[1],
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h2"
                    gutterBottom
                    id="basic-settings-title"
                    sx={{
                      color: "primary.main",
                      fontWeight: "medium",
                      fontSize: { xs: "h6.fontSize", sm: "h6.fontSize" },
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      "&::before": {
                        content: '""',
                        width: 4,
                        height: 24,
                        backgroundColor: "primary.main",
                        borderRadius: 1,
                      },
                    }}
                  >
                    {t("controls.basic.title")}
                  </Typography>
                </Box>
                <Grid
                  container
                  spacing={4}
                  role="group"
                  aria-labelledby="basic-settings-title"
                >
                  <Grid item xs={12} md={6}>
                    <Typography
                      gutterBottom
                      id="quality-slider-label"
                      sx={{
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        fontWeight: "medium",
                        color: "text.secondary",
                        mb: 1.5,
                      }}
                    >
                      {t("controls.quality.label")}
                    </Typography>
                    <Slider
                      value={quality}
                      onChange={handleQualityChange}
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                      aria-labelledby="quality-slider-label"
                      sx={{
                        "& .MuiSlider-valueLabel": {
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography
                      gutterBottom
                      id="max-width-slider-label"
                      sx={{
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        fontWeight: "medium",
                        color: "text.secondary",
                        mb: 1.5,
                      }}
                    >
                      {t("controls.maxWidth.label")}
                      {originalStats?.width && (
                        <Typography
                          component="span"
                          sx={{
                            ml: 1,
                            fontSize: "0.875rem",
                            color: "text.disabled",
                          }}
                        >
                          {t("controls.maxWidth.max", {
                            width: originalStats.width,
                          })}
                        </Typography>
                      )}
                    </Typography>
                    <Slider
                      value={maxWidth}
                      onChange={handleMaxWidthChange}
                      min={100}
                      max={maxWidthLimit}
                      step={100}
                      valueLabelDisplay="auto"
                      disabled={!originalImage}
                      aria-labelledby="max-width-slider-label"
                      sx={{
                        "& .MuiSlider-valueLabel": {
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <DitheringControls
                applyDithering={applyDithering}
                ditheringColorCount={ditheringColorCount}
                onDitheringChange={(value: boolean) => {
                  setApplyDithering(value);
                  if (originalImage) {
                    processImage(originalImage, {
                      quality,
                      maxWidth,
                      applyDithering: value,
                      applyBlur,
                      ditheringColorCount: ditheringColorCount,
                    });
                  }
                }}
                onDitheringColorCountChange={(value: number) => {
                  setDitheringColorCount(value);
                  debouncedProcessWithParams({
                    name: "ditheringColorCount",
                    value,
                  });
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: { xs: 2, sm: 3 },
                  height: "100%",
                  backgroundColor: "background.default",
                  borderRadius: 2,
                  boxShadow: (theme) => theme.shadows[1],
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  transition: "box-shadow 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: (theme) => theme.shadows[2],
                  },
                }}
                role="region"
                aria-labelledby="face-blur-section-title"
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 1, sm: 2 },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                      gap: { xs: 1.5, sm: 2 },
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="h2"
                      id="face-blur-section-title"
                      sx={{
                        color: "primary.main",
                        fontWeight: "medium",
                        fontSize: { xs: "h6.fontSize", sm: "h6.fontSize" },
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        "&::before": {
                          content: '""',
                          width: 4,
                          height: { xs: 24, sm: 24 },
                          backgroundColor: "primary.main",
                          borderRadius: 1,
                        },
                      }}
                    >
                      {t("controls.faceBlur.title")}
                    </Typography>
                    <FormControlLabel
                      sx={{
                        m: 0,
                        ml: { xs: 1, sm: 0 },
                        ".MuiFormControlLabel-label": {
                          fontSize: { xs: "1rem", sm: "1rem" },
                          color: "text.secondary",
                        },
                      }}
                      control={
                        <Switch
                          checked={applyBlur}
                          onChange={handleBlurChange}
                          disabled={!modelsLoaded}
                          aria-label={t("controls.faceBlur.toggle")}
                          size="small"
                        />
                      }
                      label={t("controls.faceBlur.label")}
                    />
                  </Box>
                  <Typography
                    id="face-blur-description"
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.875rem", sm: "0.875rem" },
                      mt: { xs: 0, sm: -1 },
                    }}
                  >
                    {t("controls.faceBlur.description")}
                  </Typography>
                  {!modelsLoaded && (
                    <Typography
                      color="text.secondary"
                      variant="body2"
                      role="alert"
                      aria-live="polite"
                      sx={{
                        fontSize: { xs: "0.875rem", sm: "0.875rem" },
                        fontStyle: "italic",
                      }}
                    >
                      {t("controls.faceBlur.loading")}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "action.hover",
                      border: "1px dashed",
                      borderColor: "primary.main",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: "text.secondary",
                        "&::before": {
                          content: '"🚧"',
                          fontSize: "1.2em",
                        },
                      }}
                    >
                      {t("controls.faceBlur.manual")}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                {t("stats.original.title")}
              </Typography>
              {originalImage && (
                <Box
                  component="img"
                  src={URL.createObjectURL(originalImage)}
                  sx={{ maxWidth: "100%", height: "auto" }}
                  alt="Original"
                />
              )}
              {metadata && (
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography
                    variant="h2"
                    sx={{
                      color: "primary.main",
                      fontWeight: "medium",
                      fontSize: { xs: "h6.fontSize", sm: "h6.fontSize" },
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      "&::before": {
                        content: '""',
                        width: 4,
                        height: { xs: 24, sm: 24 },
                        backgroundColor: "primary.main",
                        borderRadius: 1,
                      },
                    }}
                    gutterBottom
                  >
                    {t("metadata.title")}
                  </Typography>
                  {hasMetadata(metadata) ? (
                    <Grid container spacing={2}>
                      {metadata.Make && (
                        <Grid item xs={12} sm={6}>
                          <Typography>
                            <strong>{t("metadata.device")}:</strong>{" "}
                            {metadata.Make} {metadata.Model}
                          </Typography>
                        </Grid>
                      )}
                      {metadata.DateTimeOriginal && (
                        <Grid item xs={12} sm={6}>
                          <Typography>
                            <strong>{t("metadata.date")}:</strong>{" "}
                            {new Date(
                              metadata.DateTimeOriginal,
                            ).toLocaleString()}
                          </Typography>
                        </Grid>
                      )}
                      {metadata.ExposureTime && (
                        <Grid item xs={12} sm={6}>
                          <Typography>
                            <strong>{t("metadata.exposure")}:</strong>{" "}
                            {metadata.ExposureTime}s
                          </Typography>
                        </Grid>
                      )}
                      {metadata.FNumber && (
                        <Grid item xs={12} sm={6}>
                          <Typography>
                            <strong>{t("metadata.aperture")}:</strong> f/
                            {metadata.FNumber}
                          </Typography>
                        </Grid>
                      )}
                      {metadata.FocalLength && (
                        <Grid item xs={12} sm={6}>
                          <Typography>
                            <strong>{t("metadata.focalLength")}:</strong>{" "}
                            {metadata.FocalLength}mm
                          </Typography>
                        </Grid>
                      )}
                      {metadata.latitude && metadata.longitude && (
                        <Grid item xs={12}>
                          <Typography>
                            <strong>{t("metadata.location")}:</strong>{" "}
                            {metadata.latitude.toFixed(6)},{" "}
                            {metadata.longitude.toFixed(6)}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  ) : (
                    <Typography
                      color="text.secondary"
                      sx={{ fontStyle: "italic" }}
                    >
                      {t("metadata.noData")}
                    </Typography>
                  )}
                </Paper>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ position: "relative" }}>
                <Typography variant="subtitle1" gutterBottom>
                  {t("stats.optimized.title")}
                </Typography>
                {loading ? (
                  <>
                    <Box
                      ref={loadingSectionRef}
                      role="status"
                      aria-live="polite"
                      aria-busy="true"
                      aria-label={t("loading.status")}
                      sx={{
                        minHeight: "300px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        my: 4,
                      }}
                    >
                      <Box
                        component="img"
                        src="/loading-3887_256.gif"
                        sx={{
                          maxWidth: "100%",
                          height: "auto",
                          display: "block",
                          margin: "0 auto",
                        }}
                        alt={t("loading.imageAlt")}
                      />
                      <Box sx={{ textAlign: "center", mt: 2 }}>
                        <Typography
                          color="text.secondary"
                          sx={{ fontStyle: "italic", mb: 1 }}
                        >
                          {loadingMessage}
                        </Typography>
                        {progress.step && (
                          <Typography
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(progress.value)}
                            aria-valuetext={`${progress.step}: ${Math.round(progress.value)}%`}
                            aria-label={t("loading.progress", {
                              step: progress.step,
                            })}
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontFamily: "monospace", fontSize: "0.9em" }}
                          >
                            {`${progress.step} : ${Math.round(progress.value)}%`}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </>
                ) : (
                  compressedImage && (
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
                            style={{ maxWidth: "100%" }}
                            alt="To crop"
                          />
                        </ReactCrop>
                      ) : (
                        <Box
                          component="img"
                          src={compressedImage}
                          sx={{ maxWidth: "100%", height: "auto" }}
                          alt={
                            compressedStats
                              ? t("image.compressed.alt", {
                                  width: compressedStats.width,
                                  height: compressedStats.height,
                                  quality: quality,
                                })
                              : t("image.compressed.alt", {
                                  width: 0,
                                  height: 0,
                                  quality: quality,
                                })
                          }
                        />
                      )}
                      <Typography
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        {t("metadataRemoved")}
                      </Typography>
                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          gap: 2,
                          alignItems: "center",
                        }}
                      >
                        <Tooltip title={t("actions.rotate")}>
                          <IconButton onClick={handleRotation} color="primary">
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
                              {t("actions.crop.apply")}
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => setIsCropping(false)}
                            >
                              {t("actions.crop.cancel")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outlined"
                              onClick={() => setIsCropping(true)}
                            >
                              {t("actions.crop.start")}
                            </Button>
                            <Button
                              variant="contained"
                              startIcon={<DownloadIcon />}
                              onClick={downloadImage}
                            >
                              {t("actions.download")}
                            </Button>
                          </>
                        )}
                      </Box>
                    </>
                  )
                )}
              </Box>
            </Grid>
          </Grid>

          <Footer />

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </CardContent>
      </Card>
    </main>
  );
};

export default ImageOptimizer;
