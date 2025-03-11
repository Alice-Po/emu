import {
  Box,
  FormControlLabel,
  Paper,
  Slider,
  Switch,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { DitheringControlsProps } from "../types/ImageOptimizer.types";
import ColorPalette from "./ColorPalette";

/**
 * Component that handles dithering controls for image processing
 * @returns {JSX.Element} The DitheringControls component
 */
const DitheringControls: React.FC<DitheringControlsProps> = ({
  applyDithering,
  onDitheringChange,
  colorCount,
  onColorCountChange,
  currentPalette,
}) => {
  const { t } = useTranslation();

  const handleDitheringToggle = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onDitheringChange(event.target.checked);
  };

  const handleColorCountChange = (_event: Event, value: number | number[]) => {
    onColorCountChange(value as number);
  };

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        height: "100%",
        backgroundColor: "background.default",
        borderRadius: 2,
        boxShadow: (theme) => theme.shadows[1],
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
      role="region"
      aria-labelledby="dithering-section-title"
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
            id="dithering-section-title"
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
            {t("controls.dithering.title")}
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
                checked={applyDithering}
                onChange={handleDitheringToggle}
                aria-label={t("controls.dithering.toggle")}
                size="small"
              />
            }
            label={t("controls.dithering.label")}
          />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: { xs: "0.875rem", sm: "0.875rem" },
            mt: { xs: 0, sm: -1 },
          }}
        >
          {t("controls.dithering.description")}
        </Typography>

        {applyDithering && (
          <>
            <Box sx={{ mt: 2 }}>
              <Typography
                gutterBottom
                id="color-count-slider-label"
                sx={{
                  fontSize: { xs: "1rem", sm: "1rem" },
                  fontWeight: "medium",
                  color: "text.secondary",
                  mb: 1,
                }}
              >
                {t("controls.dithering.colors")}
              </Typography>
              <Slider
                value={colorCount}
                onChange={handleColorCountChange}
                min={2}
                max={32}
                step={1}
                marks={[
                  { value: 2, label: "2" },
                  { value: 8, label: "8" },
                  { value: 16, label: "16" },
                  { value: 32, label: "32" },
                ]}
                valueLabelDisplay="auto"
                aria-labelledby="color-count-slider-label"
              />
            </Box>
            {currentPalette && currentPalette.length > 0 && (
              <ColorPalette colors={currentPalette} />
            )}
          </>
        )}
      </Box>
    </Paper>
  );
};

export default DitheringControls;
