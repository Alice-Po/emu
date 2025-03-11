import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import { useTranslation } from "react-i18next";

const ContactButton = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [showAlert, setShowAlert] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    try {
      const response = await fetch("https://formspree.io/f/mjkbnlaz", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        setStatus("success");
        form.reset();
        setOpen(false);
      } else {
        setStatus("error");
      }
      setShowAlert(true);
    } catch (error) {
      setStatus("error");
      setShowAlert(true);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<EmailIcon />}
        size="small"
        onClick={() => setOpen(true)}
        sx={{
          borderColor: "black/15 dark:border-white/20",
          "&:hover": {
            backgroundColor: "black/5 dark:bg-white/10",
          },
        }}
      >
        Envoyer un message
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "primary.main" }}>
          Envoyer un message
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                required
                id="email"
                name="email"
                type="email"
                label={t("contact.emailLabel")}
                fullWidth
                autoComplete="email"
              />

              <TextField
                required
                id="message"
                name="message"
                label={t("contact.messageLabel")}
                multiline
                rows={4}
                fullWidth
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" variant="contained">
              {t("contact.submit")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={showAlert}
        autoHideDuration={3000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowAlert(false)}
          severity={status === "success" ? "success" : "error"}
          variant="filled"
        >
          {t(status === "success" ? "contact.success" : "contact.error")}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContactButton;
