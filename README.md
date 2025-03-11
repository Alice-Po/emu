# Emu

A privacy-focused, eco-friendly image optimization application that processes everything locally in your browser.

## Key Features

- Smart image compression with quality control
- Dithering and color reduction algorithms
- Automatic face blurring for privacy protection
- Image cropping and rotation tools
- EXIF metadata viewing and automatic removal
- Available in multiple languages.

All image processing happens locally in your browser - no server uploads required! Your images stay on your device, ensuring complete privacy and data protection.

## 💻 Technical Stack

### Core Technologies

- React 19 with TypeScript
- Vite for blazing fast builds
- Material-UI v6 for modern UI components

### Image Processing Libraries

- `browser-image-compression` - Client-side image compression
- `face-api.js` - Face detection and blurring
- `exifr` - EXIF metadata handling
- `react-image-crop` - Image cropping interface
- `rgbquant` - Dithering and color reduction algorithms

### Internationalization

- `i18next` with browser language detection
- Modular translation system
- RTL support ready

## 🏄 Getting Started

1. Clone the repository:

```bash
git clone https://github.com/Alice-Po/emu.git
cd emu
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Contributing

We welcome contributions from everyone around the world!

## License

This project is licensed under the [WTFPL](https://en.wikipedia.org/wiki/WTFPL) License.
