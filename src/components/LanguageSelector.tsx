import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

/**
 * Language selector component that allows users to switch between available languages
 * @returns {JSX.Element} The LanguageSelector component
 */
const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Box
      component="section"
      aria-labelledby="language-section-title"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Typography
        variant="h2"
        id="language-section-title"
        sx={{
          fontSize: "0.9rem",
          color: "text.secondary",
          fontWeight: "medium",
        }}
      >
        {t("language")}
      </Typography>
      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        size="small"
        aria-label={t("language")}
        title={t("language")}
        sx={{
          minWidth: 120,
          height: 32,
          ".MuiSelect-select": {
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          },
        }}
      >
        <MenuItem
          value="fr"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Box component="span" sx={{ fontSize: "1.2em", lineHeight: 1 }}>
            🇫🇷
          </Box>
          Français
        </MenuItem>
        <MenuItem
          value="en"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Box component="span" sx={{ fontSize: "1.2em", lineHeight: 1 }}>
            🇬🇧
          </Box>
          English
        </MenuItem>
        <MenuItem
          value="es"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Box component="span" sx={{ fontSize: "1.2em", lineHeight: 1 }}>
            🇪🇸
          </Box>
          Español
        </MenuItem>
        <MenuItem
          value="it"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Box component="span" sx={{ fontSize: "1.2em", lineHeight: 1 }}>
            🇮🇹
          </Box>
          Italiano
        </MenuItem>
        <MenuItem
          value="hi"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Box component="span" sx={{ fontSize: "1.2em", lineHeight: 1 }}>
            🇮🇳
          </Box>
          हिंदी
        </MenuItem>
        <MenuItem
          value="ja"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Box component="span" sx={{ fontSize: "1.2em", lineHeight: 1 }}>
            🇯🇵
          </Box>
          日本語
        </MenuItem>
      </Select>
    </Box>
  );
};

export default LanguageSelector;
