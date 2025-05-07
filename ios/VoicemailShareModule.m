#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VoicemailShareModule, NSObject)

RCT_EXTERN_METHOD(getSharedVoicemailPath:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
