# Image-Ecolo

Application d'optimisation d'images qui essaie de respecter la planète et la vie privée des humain.e.s qui l'habitent.

## Fonctionnalités

### Optimisation d'Images
- Compression d'images avec contrôle de la qualité (0-100%)
- Redimensionnement avec contrôle de la largeur maximale
- Conversion automatique en format optimal
- Affichage des statistiques avant/après (taille, dimensions)

### Traitement Avancé
- Mode monochrome avec couleur personnalisable
- Détection et floutage automatique des visages
- Rotation des images
- Recadrage interactif avec prévisualisation

### Métadonnées
- Lecture et affichage des métadonnées EXIF :
  - Informations sur l'appareil photo (marque, modèle)
  - Paramètres de prise de vue (exposition, ouverture, ISO)
  - Date et heure de la photo
  - Coordonnées GPS (si disponibles)

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

