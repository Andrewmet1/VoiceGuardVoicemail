const sharp = require('sharp');
const path = require('path');

async function generateIcon() {
  const size = 1024;
  const centerX = size / 2;
  const centerY = size / 2;

  // Create an SVG with a shield and lock
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#2563EB;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1E3A8A;stop-opacity:1" />
        </linearGradient>
      </defs>
      <path d="
        M ${centerX} 50 
        L ${size - 100} 200 
        V 500 
        C ${size - 100} 750 ${centerX + 200} 950 ${centerX} 974
        C ${centerX - 200} 950 100 750 100 500
        V 200
        Z
      " fill="url(#grad)" />
      <circle cx="${centerX}" cy="${centerY}" r="200" fill="#FFFFFF"/>
      <path d="
        M ${centerX - 100} ${centerY + 50}
        L ${centerX - 100} ${centerY - 100}
        C ${centerX - 100} ${centerY - 200} ${centerX} ${centerY - 200} ${centerX} ${centerY - 200}
        C ${centerX + 100} ${centerY - 200} ${centerX + 100} ${centerY - 100} ${centerX + 100} ${centerY - 100}
        L ${centerX + 100} ${centerY + 50}
      " stroke="#1E3A8A" stroke-width="40" fill="none"/>
    </svg>
  `;

  // Convert SVG to PNG
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(__dirname, '..', 'ios', 'VoiceGuardAIMobile', 'Images.xcassets', 'AppIcon.appiconset', 'icon_1024.png'));
}

generateIcon().catch(console.error);
