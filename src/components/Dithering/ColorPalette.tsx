import { Box, Paper, Typography, Tooltip, Snackbar } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useDithering } from "../../hooks/useDithering";
import { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
const ColorPalette: React.FC[] = ({ colors }) => {
  const { t } = useTranslation();

  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Convertir RGB en Hexadécimal
  const rgbToHex = (color: RgbColor): string => {
    const toHex = (n: number): string => {
      const hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
  };

  // Copier la couleur dans le presse-papier
  const handleColorClick = async (color: RgbColor) => {
    const hexColor = rgbToHex(color);
    try {
      await navigator.clipboard.writeText(hexColor);
      setOpenSnackbar(true);
    } catch (err) {
      console.error("Failed to copy color code:", err);
    }
  };

  if (!colors || colors.length === 0) return null;

  return (
    <Box>
      <Typography
        variant="h3"
        sx={{
          color: "primary.main",
          fontSize: { xs: "h6.fontSize", sm: "h6.fontSize" },
          mb: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {t("controls.dithering.palette")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.3,
          p: 1,
          backgroundColor: "background.paper",
          borderRadius: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          maxWidth: "100%",
        }}
      >
        {colors.map((color, index) => (
          <Tooltip key={index} title={rgbToHex(color)} arrow placement="top">
            <Box
              key={index}
              onClick={() => handleColorClick(color)}
              sx={{
                width: 15,
                height: 15,
                flexGrow: 0,
                flexShrink: 0,
                backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                borderRadius: 0.5,
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Typography
        variant="caption"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          mt: 1,
          color: "text.secondary",
          fontSize: "0.75rem",
          opacity: 0.8,
          justifyContent: "center",
        }}
      >
        <ContentCopyIcon sx={{ fontSize: "0.9rem" }} />
        {t("colorPalette.clickToCopy") ||
          "Cliquez sur une couleur pour copier son code"}
      </Typography>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        message={t("colorPalette.copied") || "Code couleur copié !"}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default ColorPalette;
