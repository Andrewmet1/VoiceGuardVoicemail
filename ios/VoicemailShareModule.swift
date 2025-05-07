import Foundation
import React

@objc(VoicemailShareModule)
class VoicemailShareModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func getSharedVoicemailPath(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    if let path = AppDelegate.sharedVoicemailPath {
      // Clear the path after retrieving it to prevent reuse
      AppDelegate.sharedVoicemailPath = nil
      resolve(path)
    } else {
      resolve(nil)
    }
  }
}
