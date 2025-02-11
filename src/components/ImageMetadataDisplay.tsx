import { Grid, Paper, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useImageMetadata } from "../hooks/useImageMetadata";

interface ImageMetadataProps {
  file: File | null;
}

const ImageMetadataDisplay: React.FC<ImageMetadataProps> = ({ file }) => {
  const { t } = useTranslation();
  const { metadata, processMetadata, hasMetadata } = useImageMetadata();

  React.useEffect(() => {
    if (file) {
      processMetadata(file);
    }
  }, [file, processMetadata]);

  if (!metadata) return null;

  return (
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
                <strong>{t("metadata.device")}:</strong> {metadata.Make}{" "}
                {metadata.Model}
              </Typography>
            </Grid>
          )}
          {metadata.DateTimeOriginal && (
            <Grid item xs={12} sm={6}>
              <Typography>
                <strong>{t("metadata.date")}:</strong>{" "}
                {new Date(metadata.DateTimeOriginal).toLocaleString()}
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
                <strong>{t("metadata.aperture")}:</strong> f/{metadata.FNumber}
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
                {metadata.latitude.toFixed(6)}, {metadata.longitude.toFixed(6)}
              </Typography>
            </Grid>
          )}
        </Grid>
      ) : (
        <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
          {t("metadata.noData")}
        </Typography>
      )}
    </Paper>
  );
};

export default ImageMetadataDisplay;
