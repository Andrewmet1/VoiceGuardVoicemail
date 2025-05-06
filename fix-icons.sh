#!/bin/bash

# Script to fix icon issues in VoiceGuard AI Mobile app
# This script copies the vector icon fonts to the correct locations in iOS and Android projects

echo "🔧 Fixing icon issues in VoiceGuard AI Mobile app..."

# Create directories if they don't exist
mkdir -p android/app/src/main/assets/fonts
mkdir -p ios/Fonts

# Copy fonts to Android
echo "📱 Copying fonts to Android project..."
cp -f node_modules/react-native-vector-icons/Fonts/*.ttf android/app/src/main/assets/fonts/

# Copy fonts to iOS
echo "📱 Copying fonts to iOS project..."
cp -f node_modules/react-native-vector-icons/Fonts/*.ttf ios/Fonts/

# Update Info.plist to include fonts
echo "📝 Updating iOS Info.plist to include fonts..."
if [ -f ios/VoiceGuardMobile/Info.plist ]; then
  # Check if fonts are already in Info.plist
  if ! grep -q "<key>UIAppFonts</key>" ios/VoiceGuardMobile/Info.plist; then
    # Add fonts to Info.plist before the last </dict>
    sed -i '' 's|</dict>|  <key>UIAppFonts</key>\
  <array>\
    <string>AntDesign.ttf</string>\
    <string>Entypo.ttf</string>\
    <string>EvilIcons.ttf</string>\
    <string>Feather.ttf</string>\
    <string>FontAwesome.ttf</string>\
    <string>FontAwesome5_Brands.ttf</string>\
    <string>FontAwesome5_Regular.ttf</string>\
    <string>FontAwesome5_Solid.ttf</string>\
    <string>Foundation.ttf</string>\
    <string>Ionicons.ttf</string>\
    <string>MaterialIcons.ttf</string>\
    <string>MaterialCommunityIcons.ttf</string>\
    <string>SimpleLineIcons.ttf</string>\
    <string>Octicons.ttf</string>\
    <string>Zocial.ttf</string>\
  </array>\
</dict>|' ios/VoiceGuardMobile/Info.plist
    echo "✅ Added fonts to Info.plist"
  else
    echo "ℹ️ Fonts already in Info.plist"
  fi
else
  echo "❌ Error: Info.plist not found"
fi

echo "🔄 Cleaning build folders..."
rm -rf android/app/build
rm -rf ios/build

echo "✅ Icon fix complete! Please rebuild your app with:"
echo "  npx react-native run-ios"
echo "  or"
echo "  npx react-native run-android"
