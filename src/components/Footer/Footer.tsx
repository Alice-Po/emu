import {
  Box,
  Link,
  Typography,
  Stack,
  Divider,
  Button,
  Link as MuiLink,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import BugReportIcon from "@mui/icons-material/BugReport";
import GitHubIcon from "@mui/icons-material/GitHub";
import ContactForm from "./ContactForm";
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
      {/* Section contribution */}
      <Stack
        spacing={2}
        sx={{
          p: 2,
        }}
      >
        <Typography variant="subtitle1" color="primary.main">
          {t("footer.aboutEmu")}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {t("footer.description")}
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 2, sm: 3 }}
          justifyContent="center"
          sx={{
            width: { xs: "100%", sm: "auto" },
            "& a": {
              textDecoration: "none",
              transition: "transform 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
            },
            "& a, & > *": {
              width: { xs: "100%", sm: "auto" },
            },
          }}
        >
          <MuiLink
            href="https://github.com/Alice-Po/emu/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              variant="outlined"
              startIcon={<BugReportIcon />}
              size="small"
              fullWidth={true}
            >
              {t("footer.reportBug")}
            </Button>
          </MuiLink>

          <MuiLink
            href="https://github.com/Alice-Po/emu"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              variant="outlined"
              startIcon={<GitHubIcon />}
              size="small"
              fullWidth={true}
            >
              {t("footer.contribute")}
            </Button>
          </MuiLink>
          <ContactForm />
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        {t("footer.madeIn")}
      </Typography>
    </Box>
  );
};

export default Footer;
