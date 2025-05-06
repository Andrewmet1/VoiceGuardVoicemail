const sharp = require('sharp');
const path = require('path');

async function resizeImages() {
  const sourcePath = path.join(__dirname, '..', 'ios', 'VoiceGuardMobile', 'Images.xcassets', 'AppIcon.appiconset', 'AppIcon.png');
  const targetDir = path.join(__dirname, '..', 'ios', 'VoiceGuardMobile', 'Images.xcassets', 'SplashLogo.imageset');

  // Create 3x version (384x384)
  await sharp(sourcePath)
    .resize(384, 384)
    .toFile(path.join(targetDir, 'splash-logo@3x.png'));

  // Create 2x version (256x256)
  await sharp(sourcePath)
    .resize(256, 256)
    .toFile(path.join(targetDir, 'splash-logo@2x.png'));

  // Create 1x version (128x128)
  await sharp(sourcePath)
    .resize(128, 128)
    .toFile(path.join(targetDir, 'splash-logo.png'));
}

resizeImages().catch(console.error);
