import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface AppliedTreatmentsProps {
  quality: number;
  originalStats: { size: number; width: number; height: number } | null;
  compressedStats: { size: number; width: number; height: number } | null;
  applyBlur: boolean;
  rotation: number;
  calculateCompressionRatio: (
    originalStats: any,
    compressedStats: any,
  ) => number;
  formatFileSize: (size: number) => string;
  applyDithering?: boolean;
  colorCount?: number;
}

const AppliedTreatments: React.FC<AppliedTreatmentsProps> = ({
  quality,
  originalStats,
  compressedStats,
  applyBlur,
  rotation,
  calculateCompressionRatio,
  formatFileSize,
  applyDithering,
  colorCount,
}) => {
  const { t } = useTranslation();

  return (
    <Paper
      sx={{
        mt: 3,
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontSize: "1rem",
          fontWeight: "medium",
          mb: 2,
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          gap: 1,
          "&::before": {
            content: '""',
            width: 4,
            height: 20,
            backgroundColor: "primary.main",
            borderRadius: 1,
          },
        }}
      >
        {t("processInfo.title", "Traitements appliqués")}
      </Typography>

      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        {/* Compression info */}
        <Typography component="li" sx={{ mb: 1 }}>
          {t("processInfo.compression", {
            quality,
            ratio: calculateCompressionRatio(originalStats, compressedStats),
            originalSize: formatFileSize(originalStats?.size || 0),
            newSize: formatFileSize(compressedStats?.size || 0),
          })}
        </Typography>

        {/* Resizing info */}
        {originalStats &&
          compressedStats &&
          (originalStats.width !== compressedStats.width ||
            originalStats.height !== compressedStats.height) && (
            <Typography component="li" sx={{ mb: 1 }}>
              {t("processInfo.resize", {
                originalWidth: originalStats.width,
                originalHeight: originalStats.height,
                newWidth: compressedStats.width,
                newHeight: compressedStats.height,
              })}
            </Typography>
          )}

        {/* Dithering info */}
        {applyDithering && colorCount && (
          <Typography component="li" sx={{ mb: 1 }}>
            {t("processInfo.dithering", {
              colors: colorCount,
            })}
          </Typography>
        )}

        {/* Face blur info */}
        {applyBlur && (
          <Typography component="li" sx={{ mb: 1 }}>
            {t("processInfo.faceBlur")}
          </Typography>
        )}

        {/* Rotation info */}
        {rotation !== 0 && (
          <Typography component="li" sx={{ mb: 1 }}>
            {t("processInfo.rotation", {
              degrees: rotation,
            })}
          </Typography>
        )}

        {/* Metadata info */}
        <Typography component="li" sx={{ mb: 1 }}>
          {t("processInfo.metadata")}
        </Typography>
      </Box>
    </Paper>
  );
};

export default AppliedTreatments;
