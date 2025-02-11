import { Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

/**
 * Component that displays the main features of the application
 * @returns {JSX.Element} The FeaturesDescription component
 */
const FeaturesDescription: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography component="div" variant="body2" sx={{ mb: 2 }}>
        <strong>{t("features.title")}</strong>
        <ul>
          <li>{t("features.list.compression")}</li>
          <li>{t("features.list.faceBlur")}</li>
          <li>{t("features.list.cropRotate")}</li>
          <li>{t("features.list.metadata")}</li>
        </ul>
      </Typography>
      <Typography variant="body2" color="primary" sx={{ fontWeight: "medium" }}>
        {t("localProcessing")}
      </Typography>
    </Paper>
  );
};

export default FeaturesDescription;
