# Image-Ecolo 🌱

A privacy-focused, eco-friendly image optimization application that processes everything locally in your browser.

## 🌟 Key Features

- 🗜️ Smart image compression with quality control
- 🎨 Customizable monochrome mode for reduced energy impact
- 🔒 Automatic face blurring for privacy protection
- 📏 Image cropping and rotation tools
- 📊 EXIF metadata viewing and automatic removal
- 🌍 Available in multiple languages:
  - English
  - Français
  - Español
  - Italiano
  - हिंदी (Hindi)
  - 日本語 (Japanese)

## 🛡️ Privacy First

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
- `image-q` - Dithering and color reduction algorithms

### Internationalization

- `i18next` with browser language detection
- Modular translation system
- RTL support ready

## 🏄 Getting Started

1. Clone the repository:

```bash
git clone https://github.com/Alice-Po/image-ecolo.git
cd image-ecolo
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

## 🤝 Contributing

We welcome contributions from developers around the world! Here's how you can help:

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 🌍 Add new translations
- 📝 Improve documentation
- 💻 Submit pull requests

### Contribution Guidelines

1. Clone the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Translation Contributions

To add a new language:

1. Copy the `/src/locales/en/translation.json` file
2. Create a new folder for your language code
3. Translate the strings
4. Add the language to the language selector in `ImageOptimizer.tsx`

## 📜 License

This project is licensed under the MIT License.
