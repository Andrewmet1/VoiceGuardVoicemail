#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNAudioSession, NSObject)

RCT_EXTERN_METHOD(getSessionState:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(configureSession:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
