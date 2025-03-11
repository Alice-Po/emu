import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useDithering } from "../hooks/useDithering";

const ColorPalette: React.FC<ColorPaletteProps> = ({ colors }) => {
  const { t } = useTranslation();

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
          <Box
            key={index}
            sx={{
              width: 15,
              height: 15,
              flexGrow: 0,
              flexShrink: 0,
              backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
              borderRadius: 0.5,
            }}
            title={`RGB(${color.r}, ${color.g}, ${color.b})`}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ColorPalette;
