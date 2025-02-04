# Image-Ecolo

Application d'optimisation d'images qui essaie de respecter la planète et la vie privée des humain.e.s qui l'habitent.

##  Fonctionnalités principales :
- 🗜️ Compression intelligente des images avec contrôle de la qualité
- 🎨 Mode monochrome personnalisable pour réduire l'impact énergétique
- 🔒 Floutage automatique des visages pour protéger la vie privée
- 📏 Recadrage et rotation des images
- 📊 Affichage des métadonnées EXIF
Tout le traitement est fait localement dans votre navigateur, aucune image n'est envoyée sur un serveur.


### Dépendances pour le traitement d'Images
- `browser-image-compression`- Compression d'images côté client
- `face-api.js` - Détection et floutage des visages
- `exifr` - Lecture des métadonnées EXIF
- `react-image-crop` - Interface de recadrage

### Sécurité
- Traitement des images côté client (pas d'upload serveur)

## Installation

```sh
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Build pour la production
npm run build
```

## Contribution

Les contributions sont les bienvenues ! 

## Licence

MIT

