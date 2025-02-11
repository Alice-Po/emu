import { Box, Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

/**
 * Footer component displaying contribution information and credits
 * @returns {JSX.Element} The Footer component
 */
const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={{
        p: 2,
        mt: 3,
        borderTop: 1,
        borderColor: "divider",
        textAlign: "center",
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {t("footer.contributions")}
        <Link
          href="https://github.com/Alice-Po/image-ecolo"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ ml: 1 }}
        >
          {t("footer.github")}
        </Link>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("footer.madeIn")}
      </Typography>
    </Box>
  );
};

export default Footer;
