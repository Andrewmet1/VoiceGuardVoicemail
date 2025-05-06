const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = {
  'icon-20@2x.png': 40,
  'icon-20@3x.png': 60,
  'icon-29@2x.png': 58,
  'icon-29@3x.png': 87,
  'icon-40@2x.png': 80,
  'icon-40@3x.png': 120,
  'icon-60@2x.png': 120,
  'icon-60@3x.png': 180,
  'icon-76.png': 76,
  'icon-76@2x.png': 152,
  'icon-83.5@2x.png': 167,
  'icon-1024.png': 1024,
};

async function generateIcons() {
  const inputSvg = path.join(__dirname, '..', 'assets', 'icon', 'app-icon.svg');
  const outputDir = path.join(__dirname, '..', 'ios', 'VoiceGuardAI', 'Images.xcassets', 'AppIcon.appiconset');

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Generate Contents.json
  const contents = {
    images: Object.entries(sizes).map(([name, size]) => ({
      size: `${size}x${size}`,
      idiom: 'iphone',
      filename: name,
      scale: name.includes('@3x') ? '3x' : name.includes('@2x') ? '2x' : '1x'
    })),
    info: {
      version: 1,
      author: 'xcode'
    }
  };

  await fs.writeFile(
    path.join(outputDir, 'Contents.json'),
    JSON.stringify(contents, null, 2)
  );

  // Generate each icon size
  for (const [name, size] of Object.entries(sizes)) {
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, name));
  }
}

generateIcons().catch(console.error);
