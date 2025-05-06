#import <React/RCTBridgeModule.h>
#import <React/RCTFont.h>

@interface FontLoader : NSObject <RCTBridgeModule>
@end

@implementation FontLoader

RCT_EXPORT_MODULE();

// Make sure all the fonts are registered at startup
+ (void)load {
  // Register all icon fonts
  [self registerFontWithName:@"MaterialCommunityIcons" extension:@"ttf"];
  [self registerFontWithName:@"MaterialIcons" extension:@"ttf"];
  [self registerFontWithName:@"FontAwesome" extension:@"ttf"];
  [self registerFontWithName:@"Ionicons" extension:@"ttf"];
}

+ (void)registerFontWithName:(NSString *)name extension:(NSString *)extension {
  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  NSString *fontPath = [bundle pathForResource:name ofType:extension];
  NSData *fontData = [NSData dataWithContentsOfFile:fontPath];
  
  if (fontData) {
    CFErrorRef error;
    CGDataProviderRef provider = CGDataProviderCreateWithCFData((CFDataRef)fontData);
    CGFontRef font = CGFontCreateWithDataProvider(provider);
    
    if (font) {
      if (CTFontManagerRegisterGraphicsFont(font, &error)) {
        NSLog(@"Successfully registered font: %@", name);
      } else {
        NSLog(@"Failed to register font: %@", name);
      }
      CGFontRelease(font);
    }
    CGDataProviderRelease(provider);
  } else {
    NSLog(@"Could not load font %@.%@", name, extension);
  }
}

@end
