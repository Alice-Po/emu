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
          direction="row"
          spacing={3}
          justifyContent="center"
          sx={{
            "& a": {
              textDecoration: "none",
              transition: "transform 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
            },
          }}
        >
          <MuiLink
            href="https://github.com/Alice-Po/image-ecolo/issues/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outlined"
              startIcon={<BugReportIcon />}
              size="small"
            >
              Reporter un bug
            </Button>
          </MuiLink>

          <MuiLink
            href="https://github.com/Alice-Po/image-ecolo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outlined" startIcon={<GitHubIcon />} size="small">
              Contribuer
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
