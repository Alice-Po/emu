import { Box, List, ListItem, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

/**
 * Component that displays the main features of the application
 * @returns {JSX.Element} The FeaturesDescription component
 */
const FeaturesDescription = () => {
  const { t } = useTranslation();

  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Typography variant="h2" gutterBottom sx={{ fontSize: "h6.fontSize" }}>
        {t("features.title")}
      </Typography>
      <List>
        {Object.keys(t("features.list", { returnObjects: true })).map((key) => (
          <ListItem key={key} sx={{ py: 0.5 }}>
            <Typography>{t(`features.list.${key}`)}</Typography>
          </ListItem>
        ))}
      </List>
      <Typography className="localProcessing">
        {t("localProcessing")}
      </Typography>
    </Box>
  );
};

export default FeaturesDescription;
