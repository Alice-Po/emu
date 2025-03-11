import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface DitheringDialogueProps {
  open: boolean;
  onClose: () => void;
}

const DitheringDialogue: React.FC<DitheringDialogueProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: "primary.main" }}>
        Plus d&apos;infomation sur le tramage
      </DialogTitle>
      <DialogContent>
        <Typography paragraph>
          Le traitement utilise l&apos;algorithme de tramage Floyd-Steinberg
          avec mode serpentin et préserve les valeurs alpha originales des
          pixels pour maintenir la transparence.
        </Typography>
        <Typography color="primary.main" gutterBottom>
          <GitHubIcon color="action" />
          <MuiLink
            href="https://github.com/leeoniya/RgbQuant.js/"
            target="_blank"
            rel="noopener noreferrer"
            ml={1}
          >
            Nous implémentons la librairie RgbQuant.js de leeoniya.
            <OpenInNewIcon sx={{ fontSize: 14 }} />
          </MuiLink>
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.02)",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Méthode de quantification (method: 2) :</strong> Analyse
                les petites zones de l&apos;image séparément pour mieux
                préserver les détails locaux.{" "}
                <i>
                  Choisie car elle conserve davantage les nuances subtiles et
                  les détails fins par rapport à la méthode globale,
                  particulièrement importante pour les illustrations et logos.
                </i>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>
                  Algorithme de tramage (dithKern: &quot;FloydSteinberg&quot;) :
                </strong>
                Crée une illusion de couleurs intermédiaires en disposant les
                pixels de façon alternée.{" "}
                <i>
                  Sélectionné pour son excellent équilibre entre qualité
                  visuelle et vitesse de traitement, et pour son aspect naturel
                  évitant les motifs trop réguliers ou artificiels.
                </i>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Mode serpentin (dithSerp: true) :</strong> Traite
                l&apos;image en zigzag au lieu de toujours aller de gauche à
                droite. Activé car il réduit significativement les artefacts
                visibles sur les bords horizontaux, problème courant avec les
                algorithmes de tramage standards.
              </Typography>
            </Box>

            {/* Note technique */}
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontStyle: "italic",
                  color: "text.secondary",
                  borderLeft: "2px solid",
                  borderColor: "primary.main",
                  pl: 2,
                }}
              >
                Note technique : La transparence est préservée en stockant les
                valeurs alpha originales dans une carte séparée, puis en les
                réappliquant après le processus de quantification et de tramage,
                car le processus standard peut modifier les valeurs de
                transparence.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DitheringDialogue;
