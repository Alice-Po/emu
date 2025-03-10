import { Box, Paper, Typography } from "@mui/material";
import { RgbColor } from "../hooks/useDithering";
import { useTranslation } from "react-i18next";

interface ColorPaletteProps {
  colors: RgbColor[];
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ colors }) => {
  const { t } = useTranslation();

  if (colors.length === 0) return null;

  return (
    <Paper
      sx={{
        p: 2,
        mt: 2,
        backgroundColor: "background.default",
        borderRadius: 2,
        boxShadow: (theme) => theme.shadows[1],
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography
        variant="h2"
        sx={{
          color: "primary.main",
          fontWeight: "medium",
          fontSize: { xs: "h6.fontSize", sm: "h6.fontSize" },
          mb: 1,
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
        {t("controls.dithering.palette")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          p: 1,
          backgroundColor: "background.paper",
          borderRadius: 1,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        {colors.map((color, index) => (
          <Box
            key={index}
            sx={{
              width: 20,
              height: 20,
              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
              borderRadius: 0.5,
              flexGrow: 1,
            }}
            title={`RGB(${color.r}, ${color.g}, ${color.b})`}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default ColorPalette;
